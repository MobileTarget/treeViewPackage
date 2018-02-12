module.exports = function(RED) {
	var	treeViewHelper	= require('./treeViewHelper'),
		database		= require('./database'),
		_	  			= require('underscore');
			
	function treeView(config) {
		RED.nodes.createNode(this, config);

		var node 			= this ,
			databaseName	= config.database,
			username		= config.username,
			password		= config.password,
			partialFlag		= config.flagMode ;
			operation		= config.operation;
			
		//initalizing helper init method
		treeViewHelper.init();
		database.init(databaseName, username, password);
	
		node.on('input', function(msg) {
		
			if(_.isEmpty(databaseName)){
				msg.payload = `Database name must be set to make ${node.type} node working.`;
				node.send(msg);
				return false;
			}
			
			if(_.isEmpty(username) || _.isEmpty(password)){
				msg.payload = `Either username or password should not empty to make ${node.type} node working properly.`;
				node.send(msg);
				return false;
			}
			
			
			var localMsg = {},
				action_array = [],
				count=0,
				init_load = msg.payload;
				
			for (var each_record in init_load) {
				if(init_load[each_record]){
					var record = init_load[each_record];
					var payload = [];
					for (var each_item in record.payload) {
						if(each_item){
							payload.push(record.payload[each_item]);	
						}
					}
			
					localMsg = {};
					localMsg.fn_name = record.fn_name;
					localMsg.payload = payload;
					action_array.push(localMsg);	
					count++;
				}
			}
					
			if(operation == "test"){
				// changeing true/false string to boolean value;
				partialFlag = JSON.parse(config.flagMode);
				
				reset_db_new(msg, true, partialFlag, function(return_object1){
					console.log('return_object1', return_object1);
					treeViewHelper.process_msg(action_array, function(return_object){
						console.log(return_object);
						msg.payload = return_object;
						node.send(msg);
					});
				});
			}else if( operation == "prod"){
				//console.log("Comes here before going to treeHelper.process_msg");
				treeViewHelper.process_msg(action_array, function(return_object){
					console.log(JSON.stringify(return_object));
					msg.payload = return_object;
					node.send(msg);
				});
			}else{
				msg.payload = "Un-specified operation for Tree view node.";
				node.send(msg);
			}
		});
		
		function reset_db_new(msg, isReset, partialFlag, callback){
			var node_original = {}, nodes = [];
			partialFlag = partialFlag || true ;
			
			if (partialFlag) {
				node_original = msg.node_original1;
			} else {
				node_original=Object.assign(msg.node_original1, msg.node_original2);
			} 
			// delete cloudant database
			
			if(isReset){ // in test case need to make database empty in each call
				database.resetDatabase(function(obj){
					if(obj.isReset){
						//debugger;
						nodes = [];
						for (var each_record in node_original) {
							if(node_original[each_record]){
								nodes.push(node_original[each_record]);
							}
						}
						
						treeViewHelper.save_array(nodes, callback);
					}else{
						nodes = [];
						for (let each in node_original) {
							if(node_original[each]){
								nodes.push(node_original[each]);
							}
						}
						treeViewHelper.save_array(nodes, callback);
					}
				});	
			}else{ // in production case no need to make database empty
				nodes = [];
				for (let each in node_original) {
					if(node_original[each]){
						nodes.push(node_original[each]);
					}
				}
				treeViewHelper.save_array(nodes, callback);
			}
		}
	}
	
	//Register function to Node-red nodes
	RED.nodes.registerType("Tree View", treeView);
};
