var axios = require('axios');

var db = {
    databaseName: "",
    databaseUsername: "",
    databasePassword: "",
    databaseUrl: "",
    init: function(databaseName, databaseUsername, databasePassword){
        this.databaseName = databaseName;
        this.databaseUsername = databaseUsername;
        this.databasePassword = databasePassword;
        this.databaseUrl = `https://${this.databaseUsername}.cloudant.com/${this.databaseName}`;
    },
    httpRequest: function(url, method, payload, callback){
        var config = {
            auth: {
                username: this.databaseUsername,
                password: this.databasePassword
            } , //basic auth credentails used for cloudant database
            timeout: 30000 , //if the response not comes in 30sec axios will abort the request;
            url: url,  // cloudant database url for views, query's 
            method: method, //method used to communicate with cloudant database i.e get,post,put,delete,patch
        };
        
        switch(method) {
            case "GET":
                axios
                .request(config)
                .then(function(response){
                    callback(response.data, 'success');
                }).catch(function(exception){
                    if (exception.response) {
                        callback(exception.response.data, 'error');
                    } else if (exception.request) {
                        callback(exception.request, 'error');
                    } else {
                        callback(exception.message, 'error');
                    }
                });
                break;
            
            case "POST":
                config.data = payload ;
                axios
                .request(config)
                .then(function(response){
                    callback(response.data, 'success');
                }).catch(function(exception){
                    if (exception.response) {
                        callback(exception.response.data, 'error');
                    } else if (exception.request) {
                        callback(exception.request, 'error');
                    } else {
                        callback(exception.message, 'error');
                    }
                });
                break;
            
            case "PUT":
                config.data = payload ;
                axios
                .request(config)
                .then(function(response){
                    callback(response.data, 'success');
                }).catch(function(exception){
                    if (exception.response) {
                        callback(exception.response.data, 'error');
                    } else if (exception.request) {
                        callback(exception.request, 'error');
                    } else {
                        callback(exception.message, 'error');
                    }
                });
                break;

            case "DELETE":
                axios
                .request(config)
                .then(function(response){
                    callback(response.data, 'success');
                }).catch(function(exception){
                    if (exception.response) {
                        callback(exception.response.data, 'error');
                    } else if (exception.request) {
                        callback(exception.request, 'error');
                    } else {
                        callback(exception.message, 'error');
                    }
                });
                break;

            default:
                callback("Exception raised: No such method is defined.");
                break;
        }
    },
    sendResponse: function(data, status, callerFn, callback){
        if(status == "error"){
            callback(null);
        }else if(status == "success"){
            if(callerFn == "searchRecordsFromDatabase"){
                var payload = {};
                if(data.rows){
                    data.rows.forEach((obj)=>{
                        payload[obj.value._id] = obj.value ;
                    });
                    callback(payload);
                }else if(data.docs){
                    callback(data.docs);
                }else{
                    callback(payload);
                }
            }else{
                callback(data);    
            }
        }else{
            throw new Error(`Exception raised inside ${callerFn}:- Failed to fetch data from database.`);
        }
    },
    resetDatabase: function(callback){
        var url = `https://${this.databaseUsername}.cloudant.com/_all_dbs`, self = this;
        
        this.httpRequest(url, 'GET', null, function(data, status){
            if(status == "success" && data){
                if(data.indexOf(self.databaseName) > -1){
                    self.httpRequest(self.databaseUrl, 'DELETE', null, function(data, status){
                        if(status == "success" && data.ok){
                            self.httpRequest(self.databaseUrl, 'PUT', null, function(data, staus){
                                if(staus == "success" && data.ok){
                                    callback({isReset: true, msg: "Database reset successfully."});
                                }else{
                                    callback({isReset: false, msg: "Error while creating empty database"});
                                }
                            });
                        } else{
                            callback({isReset: false, msg: "Error while removing database."});
                        }
                    });
                }else{
                    self.httpRequest(self.databaseUrl, 'PUT', null, function(data, staus){
                        if(staus == "success" && data.ok){
                            callback({isReset: true, msg: "Database reset successfully."});
                        }else{
                            callback({isReset: false, msg: "Error while creating empty database"});
                        }
                    });
                }
            }else{
                callback({isReset: false, msg: "Error while creating empty database"});
            }
        });
    },
    searchNodeById: function(id, callback){
        var url = `${this.databaseUrl}/${id}`, self = this;
       // console.log(">>>>>>>>>>> inside searchNodeById database method", url);
        this.httpRequest(url, "GET", null, function(data, status){
            self.sendResponse(data, status, 'getById', callback);
        });
    },
    saveNode: function(obj, callback){
        var self = this;
        this.httpRequest(this.databaseUrl, 'POST', obj, function(data, status){
            console.info("Node saved successfully with following object", data); 
            self.sendResponse(data, status, 'saveNode', callback); 
        });
    },
    saveArray: function(arr, callback){
        var self = this, url = `${this.databaseUrl}/_bulk_docs`;
        this.httpRequest(url, 'POST', {docs: arr}, function(data, status){
            self.sendResponse(JSON.parse(JSON.stringify(arr)), status, 'saveArray', callback);
        });
    },
    deleteArray: function(arr, callback){
        var self = this, url = `${this.databaseUrl}/_bulk_docs`, payload = [];
        
        arr.forEach((obj)=>{
            if(obj._id && obj._rev){
                payload.push({ _id: obj._id, _rev: obj._rev, _deleted: true });
            }
        });
        
        this.httpRequest(url, 'POST', { docs: payload}, function(data, status){
            self.sendResponse(data, status, 'deleteArray', callback);
        });
    },
    searchRecordsFromDatabase: function(queryFields, callback){
        var self = this, url = `${this.databaseUrl}/_find`;
        
        this.httpRequest(url, 'POST', queryFields, function(data, status){
            self.sendResponse(data, status, 'searchRecordsFromDatabase', callback);
        });
    }
    
};


module.exports = db;