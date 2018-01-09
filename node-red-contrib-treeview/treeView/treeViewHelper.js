var axios 			= require('axios');

module.exports = {
    validateIfDatabaseExists: function(cloudant, database, callback){
        cloudant.db.list(function(err, all_dbs) {
            if (err) {
                if (err.status_code === 403) {
                    // if err.status_code is 403 then we are probably using
                    // an api key, so we can assume the database already exists
                    callback("Authorization error:-" + err, null);
                }
                callback("Failed to fetch list of databases:-" + err, null);
            }
            else {
                if (all_dbs && all_dbs.indexOf(database) < 0) {
                    cloudant.db.create(database, function(err, body) {
                        if (err) {
                            callback("Failed to create database:-"+ err , null);
                        }else{
                            callback(null, body);
                        }
                    });
                }else{
                    callback(null, all_dbs);
                }
            }
        });
    },
    formatUrl: function(url){
        var regex = new RegExp(/^(https|http)/);
        if( !regex.test(url) ){
            return "https://" + url ;
        }else{
            return url ;
        }
    },
    // fix field values that start with _
    // https://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields
    cleanMessage: function(msg){
        for (var key in msg) {
            if (msg.hasOwnProperty(key) && !this.isFieldNameValid(key)) {
                // remove _ from the start of the field name
                var newKey = key.substring(1, msg.length);
                msg[newKey] = msg[key];
                delete msg[key];
                node.warn("Property '" + key + "' renamed to '" + newKey + "'.");
            }
        }
        return msg;
    },
    
    isFieldNameValid: function(key){
        var allowedWords = [
            '_id', '_rev', '_attachments', '_deleted', '_revisions',
            '_revs_info', '_conflicts', '_deleted_conflicts', '_local_seq'
        ];
        return key[0] !== '_' || allowedWords.indexOf(key) >= 0;
    },
    
    // Inserts a document +doc+ in a database +db+ that migh not exist
    // beforehand. If the database doesn't exist, it will create one
    // with the name specified in +db+. To prevent loops, it only tries
    // +attempts+ number of times.
    insertDocument: function(db, doc, counts, callback) {
        db.insert(doc, function(err, body) {
            if (err && err.status_code === 404 && attempts > 0) {
                // status_code 404 means the database was not found
                return cloudant.db.create(db.config.db, function() {
                    insertDocument(db, doc, counts-1, callback);
                });
            }

            callback(err, body);
        });
    },
    
    /**
	 *	To save/update multiple records at once we need to use the
	 *	Bluk insert api which cloudantDb provides to save/update multiple records at once.
	 **/
    httpRequestCall: function(config, msg, callback){
        axios
		.request(config)
		.then(function(response){
			msg.statusCode = response.status;
			msg.payload = response.data;
			callback(null, msg);
		}).catch(function(exception){
			if (exception.response) {
				// The request was made and the server responded with a status code
				// that falls out of the range of 2xx
				console.log(exception.response.data);
				console.log(exception.response.status);
				console.log(exception.response.headers);
				msg.payload = exception.response ;
			} else if (exception.request) {
				// The request was made but no response was received
				// `error.request` is an instance of XMLHttpRequest in the browser and an instance of
				// http.ClientRequest in node.js
				console.log(exception.request);
				msg.payload = exception.request ;
			} else {
				// Something happened in setting up the request that triggered an Error
				console.log('Error', exception.message);
				msg.payload = exception.message ;
			}
			callback(null, msg);
		});
    }
};