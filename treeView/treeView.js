module.exports = function(RED) {
	var axios 	= require('axios'),
		_	  	= require('underscore');
	
	function treeView(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.on('input', function(msg) {
			if(_.isEmpty(msg.dbUrl)){
				msg.payload = `Database Url must be set to make ${node.type} node working.`;
				node.send(msg);	
			}else {
				if(_.isUndefined(msg.credentails) || _.isEmpty(msg.credentails)){
					msg.payload = `Database credentails must be defined and not empty to make ${node.type} node working properly.`;
					node.send(msg);	
				}else{
					if(!_.isObject(msg.credentails)){
						msg.payload = `Database credentails must be a valid javascript object, with keys username and password.`;
						node.send(msg);	
					}else{
						if(_.isEmpty(msg.credentails.username) || _.isEmpty(msg.credentails.password)){
							msg.payload = `Either username or password should not empty to make ${node.type} node working properly.`;
							node.send(msg);	
						}else{
							msg.method = "get";
							httpRequestCall(msg, function(err, data){
								if(err) {
									node.send(err);
								}else{
									node.send(data);
								}
							});
						}
					}
				}
			}
		});
	}
	
	RED.nodes.registerType("Tree View", treeView);
	
	
	function httpRequestCall(msg, callback){
		var config = {
			auth: msg.credentails , //basic auth credentails used for cloudant database
			timeout: 30000 , //if the response not comes in 30sec axios will abort the request;
			url: msg.dbUrl, // cloudant database url for views, query's 
			method: msg.method //method used to communicate with cloudant database i.e get,post,put,delete,patch
		}; 
		
		axios
		.request(config)
		.then(function(response){
			msg.statusCode = response.status;
			msg.payload = response.data;
			callback(null, msg);
		}).catch(function(exception){
			msg.payload = exception ;
			callback(null, msg);
		});
	}
};