module.exports = function(RED) {
	var	treeViewHelper	= require('./treeViewHelper'),
		database		= require('./database'),
		testData		= require('./test_data'),
		_	  			= require('underscore');
			
	function treeView(config) {
		RED.nodes.createNode(this, config);

		var node 			= this ,
			host 			= config.host,
			databaseName	= config.database,
			username		= config.username,
			password		= config.password,
			partialFlag		= config.flag ;
			operation		= config.operation;
			
		//initalizing helper init method
		treeViewHelper.init();
		database.init(databaseName, username, password);
	
		node.on('input', function(msg) {
			if(_.isEmpty(host)){
				msg.payload = `Host Url must be set to make ${node.type} node working.`;
				node.send(msg);	
			}
			
			if(_.isEmpty(databaseName)){
				msg.payload = `Database name must be set to make ${node.type} node working.`;
				node.send(msg);	
			}
			
			if(_.isEmpty(username) || _.isEmpty(password)){
				msg.payload = `Either username or password should not empty to make ${node.type} node working properly.`;
				node.send(msg);	
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
					//console.log(count);
					//console.log(localMsg);
					action_array.push(localMsg);	
					count++;
				}
			}
			
			// changeing true/false string to boolean value;
			partialFlag = JSON.parse(partialFlag);
			
			if(operation == "test"){
				reset_db_new(partialFlag, function(return_object1){
					console.log('return_object1', return_object1);
					treeViewHelper.process_msg(action_array, function(return_object){
						console.log(return_object);
						msg.payload = return_object;
						node.send(msg);
					});
				});
				msg.payload = `Comes inside the 'Test' operation. with partialFlag = ${partialFlag}`;
				node.send(msg);
			}else if( operation == "prod"){
				treeViewHelper.process_msg(action_array, function(return_object){
					console.log(return_object);
					msg.payload = return_object;
					node.send(msg);
				});
				msg.payload = `Comes inside the 'Prod' operation. with partialFlag = ${partialFlag}`;
				node.send(msg);
			}else{
				msg.payload = "Un-specified operation for Tree view node.";
				node.send(msg);
			}
			
		});
		
		function reset_db_new(partialFlag, callback){
			var node_original = {}, nodes = [];
			if (partialFlag) {
				node_original = testData.node_original1;
			} else {
				node_original=Object.assign(testData.node_original1, testData.node_original2);
			} 
			// delete cloudant database
			
			if(isReset){
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
			}else{
				nodes = [];
				for (var each_record in node_original) {
					if(node_original[each_record]){
						nodes.push(node_original[each_record]);
					}
				}
				treeViewHelper.save_array(nodes, callback);
			}
		}
	}
	
	//Register function to Node-red nodes
	RED.nodes.registerType("Tree View", treeView);
	
};

