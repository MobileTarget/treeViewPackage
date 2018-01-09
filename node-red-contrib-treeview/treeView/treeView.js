module.exports = function(RED) {
	var url				= require('url'),
		//queryString		= require('querystring'),
		CloudantDriver	= require('cloudant'),
		helper			= require('./treeViewHelper'),
		_	  			= require('underscore');
			
	function treeView(config) {
		RED.nodes.createNode(this, config);
		
		//initalizing helper init method
		helper.init();
		
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
			
			let configuration = { account: account, key: username,password: password, url: helper.formatUrl(host) };
						
			CloudantDriver(configuration, (err, dbInstance)=>{
				if(err){
					node.error("Failed to connect to cloudantDb:-" + err );
				}else{
					helper.validateIfDatabaseExists(dbInstance, database, (err, dbList)=>{
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
								
								case "process_msg":
									processMessageTreeViewMethod(dbInstance, database, node, msg);
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
		
		
		function fetchAllRecords(cloudant, db, node, msg){
			msg.payload = "Inside fetchAllRecords function declaration.";
			node.send(msg);
		}
		
		function saveRecordIntoDatabase (cloudant, db, node, msg){
			var payload = msg.payload;
				
			if(Object.prototype.toString.call(payload) === "[object Object]"){
				var doc = helper.cleanMessage(payload), dbInstance = cloudant.use(db);
				helper.insertDocument(dbInstance, doc, retryAttempts, (err, document)=>{
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
						url: helper.formatUrl(`${host}/${database}/_bulk_docs`),  // cloudant database url for views, query's 
						method: 'post', //method used to communicate with cloudant database i.e get,post,put,delete,patch
						data: {
							docs: payload 
						}
					};

				helper.httpRequestCall(local_config, msg, function(err, data){
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
		
		function processMessageTreeViewMethod(cloudant, db, node, msg){
			var action_array = msg.payload, result_array = [];
			
			if(!_.isArray(action_array)){
				node.error("Failed to process message tree view. 'msg.payload' must be of valid javascript array.");
				return false;	
			}
			
			if(_.isEmpty(action_array)) {
				node.error("Failed to process message tree view.Please check msg.payload object.");
				return false;
			}
			_.map(action_array, (obj)=>{
				if (obj.fn_name	=== "add_to_node_name_tree") {
					result_array.push( helper.add_to_node_name_tree.apply(obj.payload) );
				}
				
				if (obj.fn_name	===	"get_node_name_tree") {
					result_array.push( helper.get_node_name_tree.apply(obj.payload) );
				}
				
				if (obj.fn_name	===	"get_page") {
					result_array.push( helper.get_page.apply(obj.payload) );
				}
				
				if(obj.fn_name === "delete_from_node_name_tree"){
					result_array.push( helper.delete_from_node_name_tree.apply(obj.payload) );
				}
			});
			msg.payload = {result: result_array};
			
			node.send(msg);
		}
	}
	
	//Register function to Node-red nodes
	RED.nodes.registerType("Tree View", treeView);
};

