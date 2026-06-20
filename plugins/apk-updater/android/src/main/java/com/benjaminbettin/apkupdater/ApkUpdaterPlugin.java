package com.benjaminbettin.apkupdater;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.util.Base64;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private static final Pattern VERSION_CODE_PATTERN = Pattern.compile("versionCode=(\\d+)");
    private long pendingDownloadId = -1L;
    private BroadcastReceiver downloadReceiver;

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        try {
            PackageManager pm = getContext().getPackageManager();
            PackageInfo info = pm.getPackageInfo(getContext().getPackageName(), 0);
            JSObject ret = new JSObject();
            ret.put("versionName", info.versionName != null ? info.versionName : "unknown");
            ret.put("versionCode", getVersionCode(info));
            call.resolve(ret);
        } catch (Exception ex) {
            call.reject("Unable to read app version", ex);
        }
    }

    @PluginMethod
    public void checkForUpdate(PluginCall call) {
        String owner = call.getString("githubOwner");
        String repo = call.getString("githubRepo");
        String assetName = call.getString("apkAssetName", "bettin-release.apk");

        if (owner == null || repo == null) {
            call.reject("githubOwner and githubRepo are required");
            return;
        }

        getBridge().execute(() -> {
            try {
                PackageManager pm = getContext().getPackageManager();
                PackageInfo info = pm.getPackageInfo(getContext().getPackageName(), 0);
                int currentCode = getVersionCode(info);

                URL url = new URL("https://api.github.com/repos/" + owner + "/" + repo + "/releases/latest");
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestProperty("Accept", "application/vnd.github+json");
                connection.setRequestProperty("User-Agent", "Bettin-Android");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);

                int status = connection.getResponseCode();
                if (status >= 400) {
                    call.reject("GitHub release lookup failed with HTTP " + status);
                    return;
                }

                StringBuilder body = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        body.append(line);
                    }
                }

                JSONObject release = new JSONObject(body.toString());
                String tagName = release.optString("tag_name", "");
                String releaseNotes = release.optString("body", "");
                String releasePageUrl = release.optString("html_url", "");
                int latestCode = parseVersionCode(tagName);
                String downloadUrl = null;

                JSONArray assets = release.optJSONArray("assets");
                if (assets != null) {
                    for (int i = 0; i < assets.length(); i++) {
                        JSONObject asset = assets.getJSONObject(i);
                        if (assetName.equals(asset.optString("name"))) {
                            downloadUrl = asset.optString("browser_download_url");
                            break;
                        }
                    }
                }

                if (latestCode <= 0 && downloadUrl != null) {
                    latestCode = currentCode + 1;
                }

                JSObject ret = new JSObject();
                ret.put("updateAvailable", latestCode > currentCode && downloadUrl != null);
                ret.put("currentVersionCode", currentCode);
                ret.put("latestVersionName", tagName);
                ret.put("latestVersionCode", latestCode);
                ret.put("downloadUrl", downloadUrl);
                ret.put("releaseNotes", releaseNotes);
                ret.put("releasePageUrl", releasePageUrl);
                call.resolve(ret);
            } catch (Exception ex) {
                call.reject("Update check failed", ex);
            }
        });
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("url is required");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                Intent settingsIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                settingsIntent.setData(Uri.parse("package:" + getContext().getPackageName()));
                settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(settingsIntent);
                call.reject("Allow installs from this app, then try again.");
                return;
            }
        }

        try {
            unregisterDownloadReceiver();
            DownloadManager dm = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("Bettin' update");
            request.setDescription("Downloading latest app version");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "bettin-update.apk");
            request.setMimeType("application/vnd.android.package-archive");

            pendingDownloadId = dm.enqueue(request);
            registerDownloadReceiver();

            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception ex) {
            call.reject("Download failed to start", ex);
        }
    }

    private void registerDownloadReceiver() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (id != pendingDownloadId) return;

                DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
                Uri downloadedUri = dm.getUriForDownloadedFile(id);
                if (downloadedUri == null) return;

                installApk(downloadedUri);
            }
        };

        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(downloadReceiver, filter);
        }
    }

    private void unregisterDownloadReceiver() {
        if (downloadReceiver != null) {
            try {
                getContext().unregisterReceiver(downloadReceiver);
            } catch (IllegalArgumentException ignored) {
            }
            downloadReceiver = null;
        }
    }

    private void installApk(Uri uri) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if ("file".equalsIgnoreCase(uri.getScheme())) {
            File file = new File(uri.getPath());
            Uri contentUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".fileprovider",
                file
            );
            intent.setDataAndType(contentUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        }

        getContext().startActivity(intent);
    }

    private int getVersionCode(PackageInfo info) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return (int) info.getLongVersionCode();
        }
        return info.versionCode;
    }

    private int parseVersionCode(String tagName) {
        if (tagName == null || tagName.isEmpty()) return 0;
        Matcher matcher = VERSION_CODE_PATTERN.matcher(tagName);
    if (matcher.find()) {
      return Integer.parseInt(matcher.group(1));
    }

    Pattern buildPattern = Pattern.compile("-build(\\d+)$", Pattern.CASE_INSENSITIVE);
    Matcher buildMatcher = buildPattern.matcher(tagName);
    if (buildMatcher.find()) {
      return Integer.parseInt(buildMatcher.group(1));
    }

    Pattern plusPattern = Pattern.compile("\\+(\\d+)$");
    Matcher plusMatcher = plusPattern.matcher(tagName);
    if (plusMatcher.find()) {
      return Integer.parseInt(plusMatcher.group(1));
    }

    String digits = tagName.replaceAll("[^0-9]", "");
        if (digits.isEmpty()) return 0;
        if (digits.length() > 9) {
            digits = digits.substring(0, 9);
        }
        return Integer.parseInt(digits);
    }

    @Override
    protected void handleOnDestroy() {
        unregisterDownloadReceiver();
        super.handleOnDestroy();
    }
}
