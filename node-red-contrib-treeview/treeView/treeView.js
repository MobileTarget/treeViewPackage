module.exports = function(RED) {
	var axios 			= require('axios'),
		url				= require('url'),
		queryString		= require('querystring'),
		CloudantDriver	= require('cloudant'),
		_	  		= require('underscore');
	
	function treeView(config) {
		RED.nodes.createNode(this, config);
		var node 			= this ,
			retryAttempts	= 3,
			account			= "" ,
			host 			= config.host,
			database		= config.database,
			username		= config.username,
			password		= config.password,
			operation 		= config.operation;
	
		node.on('input', function(msg) {
			if(_.isEmpty(host)){
				msg.payload = `Host Url must be set to make ${node.type} node working.`;
				node.send(msg);	
			}
			
			if(_.isEmpty(database)){
				msg.payload = `Database name must be set to make ${node.type} node working.`;
				node.send(msg);	
			}
			
			if(_.isEmpty(username) || _.isEmpty(password)){
				msg.payload = `Either username or password should not empty to make ${node.type} node working properly.`;
				node.send(msg);	
			}
			
			if(_.isEmpty(operation)){
				msg.payload = `Operation field must be selected to make ${node.type} node working properly.`;
				node.send(msg);	
			}
			
			// remove unnecessary parts from host value
			var parsedUrl = url.parse(host);
			if (parsedUrl.host) {
				host = parsedUrl.host;
			}
			if (host.indexOf("cloudant.com") !==-1 ) {
				// extract only the account name
				account = host.substring(0, host.indexOf('.'));
			}
			
			let configuration = { account: account, key: username,password: password, url: formatUrl(host) };
						
			CloudantDriver(configuration, (err, dbInstance)=>{
				if(err){
					node.error("Failed to connect to cloudantDb:-" + err );
				}else{
					validateIfDatabaseExists(dbInstance, database, (err, dbList)=>{
						if(err){
							node.error(err);
						}else{
							msg.allPresentDatabase = dbList ;
							switch(operation) {
								case "all":
									fetchAllRecords(dbInstance, database, node, msg);
									break;
								
								case "insert":
									saveRecordIntoDatabase(dbInstance, database, node, msg);
									break;
								
								case "search":
									searchRecordIntoDatabase(dbInstance, database, node, msg);
									break;
								
								case "delete":
									deleteRecordFromDatabase(dbInstance, database, node, msg);
									break;
								
								default:
									msg.payload = "Un-specified operation for database.";
									node.send(msg);
							}
						}//closing else clause;
					});
				}
			});
		});
		
		function validateIfDatabaseExists(cloudant, database, callback){
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
		}
		
		function formatUrl(url){
			var regex = new RegExp(/^(https|http)/);
			if( !regex.test(url) ){
				return "https://" + url ;
			}else{
				return url ;
			}
		}
		
		function fetchAllRecords(cloudant, db, node, msg){
			msg.payload = "Inside fetchAllRecords function declaration.";
			node.send(msg);
		}
		
		function saveRecordIntoDatabase (cloudant, db, node, msg){
			var payload = msg.payload;
				
			if(Object.prototype.toString.call(payload) === "[object Object]"){
				var doc = cleanMessage(payload), dbInstance = cloudant.use(db);
				insertDocument(dbInstance, doc, retryAttempts, (err, document)=>{
					if (err) {
						console.log(err.toString());
						node.error("Failed to insert document: " + err.description, msg);
					}else{
						msg.payload = document;
						node.send(msg);
					}
				});
			}else if( Object.prototype.toString.call(payload) === "[object Array]" ){
				
				var local_config = {
						auth: {
							username: username,
							password: password
						} , //basic auth credentails used for cloudant database
						timeout: 30000 , //if the response not comes in 30sec axios will abort the request;
						url: formatUrl(`${host}/${database}/_bulk_docs`),  // cloudant database url for views, query's 
						method: 'post', //method used to communicate with cloudant database i.e get,post,put,delete,patch
						data: {
							docs: payload 
						}
					};

				httpRequestCall(local_config, msg, function(err, data){
					if(err) {
						node.send(err);
					}else{
						node.send(data);
					}
				});
			}else {
				msg.payload = "Failed to save record into database:- Invalid data to save" ;
				node.error(msg);	
			}
		}
		
		function searchRecordIntoDatabase(cloudant, db, node, msg){
			msg.payload = "Inside searchRecordIntoDatabase function declaration.";
			node.send(msg);
		}
		
		function deleteRecordFromDatabase(cloudant, db, node, msg){
			msg.payload = "Inside deleteRecordFromDatabase function declaration.";
			node.send(msg);
		}
		
        // fix field values that start with _
        // https://wiki.apache.org/couchdb/HTTP_Document_API#Special_Fields
        function cleanMessage(msg) {
            for (var key in msg) {
                if (msg.hasOwnProperty(key) && !isFieldNameValid(key)) {
                    // remove _ from the start of the field name
                    var newKey = key.substring(1, msg.length);
                    msg[newKey] = msg[key];
                    delete msg[key];
                    node.warn("Property '" + key + "' renamed to '" + newKey + "'.");
                }
            }
            return msg;
        }

        function isFieldNameValid(key) {
            var allowedWords = [
                '_id', '_rev', '_attachments', '_deleted', '_revisions',
                '_revs_info', '_conflicts', '_deleted_conflicts', '_local_seq'
            ];
            return key[0] !== '_' || allowedWords.indexOf(key) >= 0;
		}
		
		// Inserts a document +doc+ in a database +db+ that migh not exist
        // beforehand. If the database doesn't exist, it will create one
        // with the name specified in +db+. To prevent loops, it only tries
        // +attempts+ number of times.
        function insertDocument(db,	doc, counts, callback) {
			db.insert(doc, function(err, body) {
				if (err && err.status_code === 404 && attempts > 0) {
					// status_code 404 means the database was not found
					return cloudant.db.create(db.config.db, function() {
						insertDocument(db, doc, counts-1, callback);
					});
				}
	
				callback(err, body);
			});
		}
	}
	
	//Register function to Node-red nodes
	RED.nodes.registerType("Tree View", treeView);
	
	/**
	 *	To save/update multiple records at once we need to use the
	 *	Bluk insert api which cloudantDb provides to save/update multiple records at once.
	 **/
	function httpRequestCall(config, msg, callback){
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

