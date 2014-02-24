var AssetManagerClass = function(config) {
    
    var lines = [];
    var config_filename = config.filename;
    
    var clbck = function() { };
    
    var data = {};
    var fs = config.filesystem;
    
    var pass = function() { };
    
    var onFail = function() {
        sync();
        clbck();
    };
    
    var manifestFile = function(file) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            try {
                data = JSON.parse(evt.target.result);
            } catch(e) { };
            
            sync();
            clbck();
        };
        
        try {
            reader.readAsText(file);
        } catch(e) {
            sync();
            clbck();
        }
    };
    
    var onLoad = function(fileEntry) {
        fileEntry.file(manifestFile, onFail);
    };
    
    
    
    
    
    var load = function() {
            fs.root.getDirectory(config.subdir, {create: true, exclusive: false},function(dir) {
                fs.root.getFile(config.subdir + '/' + config_filename, {create: true, exclusive: false}, onLoad, onFail);
            }, pass );
    };
    
    var save = function(filename, value, cb, failcb) {
        
        var onFailWrite = function() {
            
            var callb = failcb || function() {};
            cb();
        }
        
        var onLoadToWrite = function(fileEntry) {
            
            
        
            var onFileWriter = function(fileWriter) {
                fileWriter.onwriteend = function(evt) {
                    var callb = cb || pass;
                    callb(fileEntry.toURL());
                };
                
                fileWriter.write(value);
            };
            
            
            fileEntry.createWriter(onFileWriter, onFailWrite);
        };
        
        fs.root.getDirectory(config.subdir, {create: true, exclusive: false},function(dir) {
            fs.root.getFile(config.subdir + '/' + filename, { create: true, exclusive: false} , onLoadToWrite, onFailWrite);
        }, pass);
    };
    
    var saveConfig = function(cb) {
        save(config_filename,JSON.stringify(data),  cb);
    };
    
    var maxSyncing = config.maxSyncing || 30;
    var currentlySyncing = 0;
    var sync = function() {
        var newProcesses = 0;
        
        // TODO: make some kind of queue or sth like this
        for(var key in data) {
            var ob = data[key];
            if(!ob.is_synced) { // this asset is not not synced
                
                if(currentlySyncing < maxSyncing) {
                    (function(kkey) {
                        currentlySyncing++;
                        newProcesses++;
                        
                        var decrease = function() {
                            currentlySyncing--;
                            if(currentlySyncing == 0) {
                                // saving config
                                saveConfig(function() {
                                    setTimeout(sync, config.timeout || 1000);
                                });
                            }
                        };
                        
                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function(e) {
                            if (this.readyState == 4 && this.status == 200){
                                
                            save(kkey, this.response, function(url) {
                                // done.
                                data[kkey].is_synced = true;
                                data[kkey].local_url = url;
                                decrease();
                                
                            }, function() {
                                decrease();
                            });
                                
                            }
                        };
                        
                        xhr.open('GET', ob.url, true);
                        xhr.responseType = 'blob';
                        xhr.send();
                        
                })(key);
                }
            }
        }
        if(!newProcesses) {
            // nothing new to sync. great. 
//            setTimeout(sync, config.timeoutEmpty || 10000);
        }
    }
    
    
    // module run is here
    load();
    
    return {
      getAsset: function(name, instead_url) {
            if(!!data[name]) {
                
                if(data[name].is_synced)
                    return data[name].local_url;
                else {
                    return instead_url || data[name].url;
                }
            } else {
                return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1px transparent dot.
            }
        },
        addAssets: function(new_data) {
            
            for(var key in new_data) {
                var ob = new_data[key];
                if(!!data[key]) {
                    // exists in set.
                    if(data[key].md5 !== ob.md5) {
                        // file changed.
                        data[key].md5 = ob.md5;
                        data[key].url = ob.url;
                        data[key].is_synced = false;
                        // TODO: adding to set or something
                    }
                    
                } else {
                    // not exists in set.
                    data[key] = {
                        url: ob.url,
                        md5: ob.md5,
                        is_synced: false
                    };
                    // TODO: add to queue or something
                    
                    
                }
            }
            sync();
        },
        onReadyCallback: function(cb) {
            clbck = cb;
        }
        
    };
    
};
