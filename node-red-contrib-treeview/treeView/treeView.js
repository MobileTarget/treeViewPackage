module.exports = function(RED) {
	var	treeViewHelper	= require('./treeViewHelper'),
		database		= require('./database'),
		_	  			= require('underscore');
			
	function treeView(config) {
		RED.nodes.createNode(this, config);

		var node 			= this ,
			host 			= config.host,
			databaseName	= config.database,
			username		= config.username,
			password		= config.password;
			
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
			
			
			//database.resetDatabase(function(data){
			//	msg.payload = data;
			//	node.send(msg);
			//});
			
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
			//console.log(">>>>>>>>>>>>>>>>>>> treeViewHelper.js", treeViewHelper.process_msg);
			treeViewHelper.process_msg(action_array, function(return_object){
				console.log(return_object);
				msg.payload = return_object;
				node.send(msg);
			});
		});
	}
	
	//Register function to Node-red nodes
	RED.nodes.registerType("Tree View", treeView);
};

