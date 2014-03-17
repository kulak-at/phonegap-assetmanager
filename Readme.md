# Phonegap AssetManager

Warning: It's an experimental package and it's API may change!

Package provides API for updating assets and data from server using Manifest file to prevent redundant downloads of a single, unchanged file.

## Manifest File

Manifest file that consists of files definition that should be downloaded.

```
{
    files: {
        'key1': {
            'url': 'file_url',
            'md5': 'file_md5'
        },
        'key2': {
            'url': 'file_url',
            'md5': 'file_md5'
        },
        ...
    }
}
```

## API

Example configuration:
```

function onDeviceReady = function() {
    window.requestFileSystem(window.PERSISTENT, 0, function(fs) {
        window.AssetManager = new AssetManagerClass({
            filesystem: fs,
            subdir: 'project_name', // subdirectory on SDCard for data
            filename: 'asset-manager-config.json', // name of config file to be created.
            maxSyncing: 40, // number of maximal parallel http requests for assets
            timeout: 1000, // timeout between each syncing package
            timeoutEmpty: 10000 // timeout between syncing package if last was empty
        });
        
        window.AssetManager.onReadyCallback(function() {
            $.ajax({ url: 'url_to_manifest_file.json'}).done(function(manifest) {
                window.AssetManager.addAssets(manifest);
            });
        });
        
    });
}

document.addEventListener('deviceready', onDeviceReady, false);
```

Requesting for asset is as simple as calling:
```
window.AssetManager.getAsset( key, instead_url );
```

### Events

There are several events you can listen to:

**Progress Event**

Fired on each files synced.
```
AssetManager.onProgressCallback(function(synced, total) {
    console.log('Synced files: ' + synced + '. Total files: ' + total);
});
```

**End Event**

Fired when all files are synced (notice, that progress event will be also called on such situation, with synced == total)

```
AssetManager.onEndCallback(function() {
    console.log('All files are synced');
});
```