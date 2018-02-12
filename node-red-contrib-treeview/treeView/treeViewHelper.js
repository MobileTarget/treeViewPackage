// set up grandfather for delete_from_node_name_treevar environment="nodered";
var environment = "nodered", // change to "nodered" when used with node-red application;
    //environment = "local", //used only in local testing and debugging
    debug = 0, // used to turn on console statements for debug == 2
    system_id = "f1b5ed9577f69c6b131d94a46b39044f", //"system_id"; // user
    error_definitions = require('./error_definations'),
    db  = require('./database');
var self;

var treeObject = {
	init: function() {
		self = this;
	},
	// actions_array array of msg with keys fn_name & payload
	// result_array optional (add the results of the actions to result_array and return it)

	process_msg: function(action_array, callback, result_array) {
		//debug=2;
        var count = 0;

		if (!result_array) result_array = []; // if no existing results sent in then create instance result_array (i.e. first call into process_msh)

		if (action_array.length != 0) {
			var msg = action_array[0]; // get first action
            
            if(msg.fn_name == "add_to_node_name_tree"){
                msg.fn_name = self.add_to_node_name_tree;
            }else if(msg.fn_name == "get_node_name_tree"){
                msg.fn_name = self.get_node_name_tree;
            }else if(msg.fn_name == "delete_from_node_name_tree"){
                //console.log("Comes in this case where to delete delete_from_node_name_tree");
                msg.fn_name = self.delete_from_node_name_tree;
            }else if(msg.fn_name == "get_page"){
                msg.fn_name = self.get_page;
            }else {
                console.log("Un-expacted function .....");
                callback(null, error_definitions.error_empty);
                return false;
            }
            
			if (debug == 2) console.log(msg);

			if (typeof(msg.fn_name) == "function") console.log("fn");

			// now remove that action (item 0) from action array, action_array is now smaller
			action_array.splice(0, 1);

			// create callback function for what should happen after the current action 
			var call_fn = function(res) {
				console.log(count);
				console.log({result: res});
				//console.log(JSON.parse(JSON.stringify(node_records)));
				count++;
				// res will be the result from the call
				// push it into current result_array
				result_array.push(res);
				//console.log(res)
				//console.log(result_array)

				if (action_array.length != 0) { // if there are more actions to do then recurse.  Send in smaller action_array and current result_array
					self.process_msg(action_array, callback, result_array);
				} else {
					// if no more action then we are done
					// result_array will be in wrong order, fix order before calling back
					callback(result_array); //(result_array.reverse());
				}
			};

			// add call_fn as the callback (last parameter) to fn we are calling
			msg.payload.push(call_fn);

			// call the current action fn in msg.fn
			// the original call includes call_fn which will send current result array and smaller action array back to recurse
			msg.fn_name.apply(null, msg.payload);
		} else {
			callback(null, error_definitions.error_empty); // we need at least one action to be sent in
		}
	},

	// delete_all_nodes: function(callback) {
	// 	if (environment == "nodered") {
	// 		db.searchRecordsFromDatabase(function(all_records){
	// 			var payload = [];
	// 			for (var each_record in all_records) {
	// 				if (all_records[each_record].table == "node") {
	// 					//delete node_records[node_records[each_record]._id];
	// 					payload.push(all_records[each_record]);
	// 				}
	// 			}
				
	// 			db.deleteArray(payload, function(deletedRecords){
	// 				callback(deletedRecords);
	// 			});
	// 		});
	// 	} else {
	// 		for (var each_record in node_records) {
	// 			if (node_records[each_record].table == "node") {
	// 				delete node_records[node_records[each_record]._id];
	// 			}
	// 		}
	// 		callback("deleted");
	// 	}
	// },

	search_node_id: function(user_id, node_id, callback) {
		if (environment == "nodered") {
            //console.log("comes in search_node_id method with node-red enviornment........");
			db.searchNodeById(node_id, function(data){
                console.log("comes in search_node_id method with node-red enviornment........", data);
				var node_object = data;
				if (node_object) {
					if ((user_id == null || user_id == "") || node_object.user_id == user_id) {
						var newObject = JSON.parse(JSON.stringify(node_object));
						callback({"result": newObject});
					} else {
						callback(error_definitions.error_not_authorized);
					}
				} else {
					callback(error_definitions.error_empty);
				}
			});
		} else {
			var node_object = node_records[node_id];
			if (node_object) {
				if ((user_id == null || user_id == "") || node_object.user_id == user_id) {
					var newObject = JSON.parse(JSON.stringify(node_object));
					callback({"result": newObject});
				} else {
					callback(error_definitions.error_not_authorized);
				}
			} else {
				callback(error_definitions.error_empty);
			}
		}
	},
	save_node: function(node_object, callback) {
		var return_object = {};

		if (environment == "nodered") {
			if(node_object._rev) delete node_object._rev ;
			if(node_object._id == null) delete node_object._id ;
			db.saveNode(node_object, function(data){
				if(data){
					var return_object = {},
						id = data._id || data.id ;
					
					db.searchNodeById(id, function(record){
						//node_records[data._id] = node_object; // read the node
						//var newObject = JSON.parse(JSON.stringify(data)); // do a copy to prevent pass by reference -- not necessary in production
						return_object = {
							"result": record
						};
						callback(return_object);
					});
				}else{
					callback(error_definitions.error_duplicate);
				}
			});
		} else {
			if (!node_object._id) {
				node_object._id = Math.floor(Math.random() * 10000).toString();
			} // create random id
			node_records[node_object._id] = node_object; // read the node
			var newObject = JSON.parse(JSON.stringify(node_object)); // do a copy to prevent pass by reference -- not necessary in production
			return_object = {
				"result": newObject
			};
			callback(return_object);
		}
	},
	// deletes one node, returns the node_id deleted
	// delete_one_node: function(node_id, callback){
	//     if (environment=="nodered")
	//     {

	//     }
	//     else
	//     {
	//         var return_object = error_definitions.error_delete_error;
	//         delete node_records[node_id];
	//         return_object = {"result":node_id};
	//         callback(null, return_object);
	//     }
	// },
	// reads an array of records [id, id, id  etc]
	search_bulk: function(read_array, callback) {
		//console.log(read_array)
		if (environment == "nodered") {
			var query = {
				selector: {
					_id: {
						$in : read_array
					}
				}
			};
			db.searchRecordsFromDatabase(query, function(return_object){
				if(return_object){
					callback({result: return_object});
				}else{
					callback({result: []});
				}
			});
		} else {
			var return_object = {
				result: []
			}; // error_definitions.error_empty; // theoretically impossible 
			var return_array = [];
			for (var each_record in read_array) {
				if(read_array[each_record]){
					if (debug == 2) console.log(node_records[read_array[each_record]]);
					return_array.push(JSON.parse(JSON.stringify(node_records[read_array[each_record]])));
				}
			}
			return_object = {
				"result": return_array
			};
			callback(return_object);
		}
	},

	// bulk saves an array in format [{_id:x,y:z},{_id:x,y:z},{_id:x,y:z}, etc]
	save_array: function(result_array, callback) {
		var return_object = { "result": result_array };
		//console.log(result_array)
		if (environment == "nodered") {
			// note in cloudant do all at once, not loops
			if(result_array.length>0){
				db.saveArray(result_array, function(data){
					callback({"result": data});
				});
			}else{
				if (debug == 1) console.log(return_object);
				callback({"result": data});	
			}
		} else {
			if (result_array.length > 0) {
				for (var each_record in result_array) {
					//return_object = self.save_node(result_array[each_record]);
					if(result_array[each_record]){
						var node_object = result_array[each_record];
						if (!node_object._id) {
							node_object._id = Math.floor(Math.random() * 10000);
						} // create random id
						node_records[node_object._id] = node_object; // read the node
						result_array[each_record] = JSON.parse(JSON.stringify(node_object)); // do a copy to prevent pass by reference -- not necessary in production
					}
				}
			}
			if (debug == 1) console.log(return_object);
			callback(return_object);
		}
	},

	// bulk deletes an array in format [{_id:x,y:z},{_id:x,y:z},{_id:x,y:z}, etc]
	delete_array: function(result_array, callback) {
		if (environment == "nodered") {
			db.deleteArray(result_array, function(deletedRecords){
				callback({result: result_array, deleted: deletedRecords});
			});
		} else {
			var return_object = {
				"result": result_array
			};
			if (result_array.length > 0) {
				for (var each_record in result_array) {
					delete node_records[result_array[each_record]._id];
				}
			}
			callback(return_object);
		}
	},

	// search where node_id appear in parents (i.e. direct children only)
	// userid optional, but if sent in must match each records user_id i.e. "my tree"
	// returns list
	search_children: function(user_id, node_id, callback) {
		if (environment == "nodered") {
			var query = {
				selector: {
					table: 	"node",
					parents: {
						$in: [node_id]
					},
					user_id: ( user_id ? user_id : (user_id == "" ? "" : (user_id == null ? null : null) ) )
				}
			};
			db.searchRecordsFromDatabase(query, function(return_object){
				//var return_object = error_definitions.error_empty; // theoretically impossible 
				//var return_array = [];
				//for (var each_record in all_records) {
				//	if (all_records[each_record].table == "node" &&
				//		(all_records[each_record].parents.indexOf(node_id) >= 0) &&
				//		(user_id == null || all_records[each_record].user_id == user_id)) {
				//		return_array.push(JSON.parse(JSON.stringify(all_records[each_record])));
				//	}
				//}
				//return_object = {
				//	"result": return_array
				//};
				if(return_object){
					callback({ result: return_object});	
				}else{
					callback(error_definitions.error_empty);
				}
				
			});
		} else {
			var return_object = error_definitions.error_empty; // theoretically impossible 
			var return_array = [];
			for (var each_record in node_records) {
				if (node_records[each_record].table == "node" &&
					(node_records[each_record].parents.indexOf(node_id) >= 0) &&
					(user_id == null || node_records[each_record].user_id == user_id)) {
					return_array.push(JSON.parse(JSON.stringify(node_records[each_record])));
				}
			}
			return_object = {
				"result": return_array
			};
			callback(return_object);
		}
	},
	search_tree_deep: function(user_id, node_id, callback) {
		if (environment == "nodered") {
			console.log("inside search_tree_deep");
			var query = {
				selector: {
					table: 	"node",
					ancestors: {
						$in: [node_id]
					}
				}
			};
			
			if(user_id) {
				query.selector.user_id = user_id ;
			}
			
			//console.log(">>>>>>>>>>>>>>>>>>>>>>>> search_tree_deep", query);
			db.searchRecordsFromDatabase(query, function(return_array){
				//if (debug == 2) console.log(arguments);
				//var return_array = [];
				//for (var each_record in all_records) {
				//	if (all_records[each_record].table == "node" &&
				//		(all_records[each_record].ancestors.indexOf(node_id) >= 0) &&
				//		(user_id == null || user_id == "" || all_records[each_record].user_id == user_id)) {
				//		return_array.push(JSON.parse(JSON.stringify(all_records[each_record])));
				//	}
				//}
				callback({"result": return_array});
			});
		}else {
			if (debug == 2) console.log(arguments);
			var return_array = [];
			for (var each_record in node_records) {
				if (node_records[each_record].table == "node" &&
					(node_records[each_record].ancestors.indexOf(node_id) >= 0) &&
					(user_id == null || user_id == "" || node_records[each_record].user_id == user_id)) {
					return_array.push(JSON.parse(JSON.stringify(node_records[each_record])));
				}
			}
			callback({"result": return_array});
		}
	},
	search_node_name_data_lineage: function(creator_node_id, authorizing_id, authorized_id, node_name, parent_flag, parent_node_name, callback) {
		if (environment == "nodered") {
			var query = {}, obj = {}, temp = {};

			var query1 = {
					"selector": {
						"table": "node",
						"user_id": authorizing_id,
						"data_id": authorized_id, 
						"parents": {
							"$in": [
								creator_node_id
							]
						}
					}
				};
			var query2 = {
					"selector": {
						"table": "node",
						"user_id": authorizing_id,
						"data_id": authorized_id,
					}
				};
			
			if(parent_flag){
				temp[authorizing_id] = {
                    "$exists": true
                };
				obj.data_id_lineage = temp ;
				obj.node_name = node_name;
				query1.selector.$not = obj ;
				query = query1 ;
			}else{
				temp[authorizing_id] = {
                    "$exists": true
                };
				obj.data_id_lineage = temp ;
				obj.node_name = node_name;
				query2.selector.$not = obj ;
				query = query2 ;
			}

			db.searchRecordsFromDatabase(query, function(return_object){
				if (debug == 2) {
					console.log(arguments);
				}
				
				if( Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length == 1){
					callback({ "result": return_object[0] });	
				}else{
					callback(error_definitions.error_empty);
				}
				
			});
		} else {
			if (debug == 2) {
				console.log(arguments);
			}
			var return_object = error_definitions.error_empty;
			for (var each_record in node_records) {
                
				//if (debug==2){console.log(node_records[each_record])}

				if ((!parent_flag &&
						node_records[each_record].table == "node" &&
						node_records[each_record].node_name != node_name && // else grand
						node_records[each_record].user_id == authorizing_id &&
						node_records[each_record].data_id == authorized_id &&
						node_records[each_record].data_id_lineage[authorizing_id]
						//node_records[each_record].parents.indexOf(creator_node_id)>=0 && // else parent//&&
						//node_records[each_record].data_id_lineage[authorizing_id].indexOf(node_name)>=0 // else parent -- not wanted for child check
					) || (
						parent_flag &&
						node_records[each_record].table == "node" &&
						node_records[each_record].node_name != node_name && // else grand
						node_records[each_record].user_id == authorizing_id &&
						node_records[each_record].data_id == authorized_id &&
						node_records[each_record].data_id_lineage[authorizing_id] &&
						node_records[each_record].parents.indexOf(creator_node_id) >= 0 // else parent//&&
					)) {
					var newObject = JSON.parse(JSON.stringify(node_records[each_record]));
					return_object = {
						"result": newObject
					};
					break;
				}
			}
			callback(return_object);
		}
	},

	// get records where data_id_lineage[parent_user_id] & user_id = parent_user_id & data_id= child_user_id
//	get_data_id_lineage: function(child_data_id, parent_user_id, filter, callback) {
//		if (environment=="nodered"){
//			var temp = {};
//			
//			temp[parent_user_id] = {
//				"$in" : filter
//			};
//            
//			//data_id_lineage
//			var query = {
//				"selector": {
//					"table": "node",
//					"user_id": parent_user_id,
//					"data_id_lineage": temp 
//				}
//			};
//			
//			if(!child_data_id) {
//				query.selector.data_id = child_data_id;
//			}
//			
//            
//            console.log(">>>>>>>>>>>>>>>>>> inside get_data_id_lineage fn", JSON.stringify(query) );
//			db.searchRecordsFromDatabase(query, function(return_object){
//				if (debug == 2) {
//					console.log(arguments);
//				}
//				
//				if( Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length == 1){
//					callback({ "result": return_object[0] });	
//				}else{
//					callback(error_definitions.error_empty);
//				}
//			});
//		}
//		else {
//			if (debug==1) console.log({get_data_id_lineage: filter});
//			var return_object = {};
//			var return_array = [];
//			var found = false;
//			for (var each_record in node_records) {
//				if ((node_records[each_record].table == "node") &&
//					(!child_data_id ||  node_records[each_record].data_id == child_data_id) &&
//					(node_records[each_record].data_id_lineage && node_records[each_record].data_id_lineage[parent_user_id]) &&
//					(node_records[each_record].user_id == parent_user_id)){
//
//					if (filter && filter.length!=0){
//						if (debug==1) console.log(node_records[each_record].data_id_lineage);
//						for (var each_item in filter){
//							if (debug==1) console.log(filter[each_item]);
//							if (node_records[each_record] &&
//								node_records[each_record].data_id_lineage[system_id].indexOf(filter[each_item])>-1){
//								if (debug==1) console.log("found");
//								found=true; 
//								break;
//						}
//						}
//					}
//					if (!filter || found) {
//						return_array.push(JSON.parse(JSON.stringify(node_records[each_record])));
//						if (debug==1) console.log(return_array);
//					}
//				}
//			}
//			if (debug==1) console.log(return_array);
//			if (return_array.length==0){
//				return_object=error_definitions.error_empty;
//			} else {
//				return_object = {"result": return_array};
//			}
//			callback(return_object);
//		}
//	},
    get_user_filter: function(child_data_id, parent_user_id, filter, callback) {
        /**
         *  if ((node_records[each_record].table == "node") &&
            (!child_data_id ||  node_records[each_record].data_id == child_data_id) &&
            (node_records[each_record].data_id_lineage && node_records[each_record].data_id_lineage[parent_user_id]) &&
            (node_records[each_record].user_id == parent_user_id)){
            note, filter is of no importance in this call
            as written the caller is only interested in the first element of the array, ok for now
            if not found then return empty error
        *
        *
        **/
		if (environment=="nodered"){
			var temp = {};
			
			temp[parent_user_id] = {
                "$exists": true
            };
            
            //data_id_lineage
			var query = {
				"selector": {
					"table": "node",
					"user_id": parent_user_id,
                    "data_id_lineage": temp,
                    "data_id": child_data_id
				}
			};
           
			//if(!child_data_id) query.selector.data_id = child_data_id;			
            
            console.log(">>>>>>>>>>>>>>>> inside the get_user_filter Fn", JSON.stringify(query) );
			db.searchRecordsFromDatabase(query, function(return_object){
				if (debug == 2) {
					console.log(arguments);
				}
				
				if( Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length > 0){
					callback({ "result": return_object });	
				}else{
					callback(error_definitions.error_empty);
				}
			});
		}
		else {
			if (debug==1) console.log({get_data_id_lineage: filter});
			var return_object = {};
			var return_array = [];
			var found = false;
			for (var each_record in node_records) {
				if ((node_records[each_record].table == "node") &&
					(!child_data_id ||  node_records[each_record].data_id == child_data_id) &&
					(node_records[each_record].data_id_lineage && node_records[each_record].data_id_lineage[parent_user_id]) &&
					(node_records[each_record].user_id == parent_user_id)){

					if (filter && filter.length!=0){
						if (debug==1) console.log(node_records[each_record].data_id_lineage);
						for (var each_item in filter){
							if (debug==1) console.log(filter[each_item]);
							if (node_records[each_record] &&
                                node_records[each_record].data_id_lineage[system_id].indexOf(filter[each_item])>-1){
                                if (debug==1) console.log("found");
                                found=true; 
                                break;
                            }
						}
					}
					if (!filter || found) {
						return_array.push(JSON.parse(JSON.stringify(node_records[each_record])));
						if (debug==1) console.log(return_array);
					}
				}
			}
			if (debug==1) console.log(return_array);
			if (Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length > 0){
                return_object = {"result": return_array};
			} else {
				return_object=error_definitions.error_empty;
			}
			callback(return_object);
		}
	},
    
    	// get records where data_id_lineage[parent_user_id] & user_id = parent_user_id & data_id= child_user_id
	get_details_based_on_filter: function(child_data_id, parent_user_id, filter, callback) {
		if (environment=="nodered"){
			var temp = {};
			
            temp[parent_user_id] = {"$exists": true};
            
			temp[system_id] = {
				"$in" : filter
			};
            
			//data_id_lineage
			var query = {
				"selector": {
					"table": "node",
					"user_id": parent_user_id
				}
			};
			
			if(filter) query.selector.data_id_lineage = temp;
           
			if(child_data_id) query.selector.data_id = child_data_id;
            
			
            console.log(">>>>>>>>>>>>>>>> inside the get_details_based_on_filter Fn", JSON.stringify(query) );
            
			db.searchRecordsFromDatabase(query, function(return_object){
				if (debug == 2) {
					console.log(arguments);
				}
				
				if( Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length > 0 ){
					callback({ "result": return_object });	
				}else{
					callback(error_definitions.error_empty);
				}
			});

		}
		else {
			if (debug==1) console.log({get_data_id_lineage: filter});
			var return_object = {};
			var return_array = [];
			var found = false;
			for (var each_record in node_records) {
				if ((node_records[each_record].table == "node") &&
					(!child_data_id ||  node_records[each_record].data_id == child_data_id) &&
					(node_records[each_record].data_id_lineage && node_records[each_record].data_id_lineage[parent_user_id]) &&
					(node_records[each_record].user_id == parent_user_id)){

					if (filter && filter.length!=0){
						if (debug==1) console.log(node_records[each_record].data_id_lineage);
						for (var each_item in filter){
							if (debug==1) console.log(filter[each_item]);
							if (node_records[each_record] &&
								node_records[each_record].data_id_lineage[system_id].indexOf(filter[each_item])>-1){
                                    if (debug==1) console.log("found");
                                    found=true; 
                                    break;
                            }
						}
					}
					if (!filter || found) {
						return_array.push(JSON.parse(JSON.stringify(node_records[each_record])));
						if (debug==1) console.log(return_array);
					}
				}
			}
            
			if (debug==1) console.log(return_array);
			if (Object.prototype.toString.call(return_object) == "[object Array]" && return_object.length > 0){
				return_object=error_definitions.error_empty;
			} else {
				return_object = {"result": return_array};
			}
			callback(return_object);
		}
	},
    
	// search my node_id tree where node_id appear in ancestors (i.e. children, grand_children, etc)
	// data_id must match, and node_name_user_id is the owner of that record
	//  node_name_user_id  optional, but if sent in must match each records user_id i.e. "my tree"
	// returns one object
	search_tree_data_id: function(node_id, data_id, node_name_user_id, node_name, callback) {
		if (environment == "nodered") {
			
			var query = {
					"selector": {
						"table": "node"	,
						"data_id": data_id,
						"ancestors": {
							"$in": [node_id]
						}
					}	
				};
			
			if(!node_name_user_id) {
				query.selector.user_id = node_name_user_id ;
			}
			
			db.searchRecordsFromDatabase(query, function(allRecords){
				if (debug == 2) {
					console.log(arguments);
				}
                
				var return_object = error_definitions.error_empty;
				for (var each_record in allRecords) {
					if (
						//(!node_name || node_name==node_records[each_record].node_name) && 
						allRecords[each_record].table == "node" &&
						allRecords[each_record].data_id == data_id &&
						allRecords[each_record].ancestors.indexOf(node_id) >= 0 &&
						(!node_name_user_id || allRecords[each_record].user_id == node_name_user_id)
					) {
						var newObject = JSON.parse(JSON.stringify(allRecords[each_record]));
						return_object = {
							"result": newObject
						};
						break;
					}
				}
				callback(return_object);
			});
		} else {
			if (debug == 2) {
				console.log(arguments);
			}
			var return_object = error_definitions.error_empty;
			for (var each_record in node_records) {
				if (
					//(!node_name || node_name==node_records[each_record].node_name) && 
					node_records[each_record].table == "node" &&
					node_records[each_record].data_id == data_id &&
					node_records[each_record].ancestors.indexOf(node_id) >= 0 &&
					(!node_name_user_id || node_records[each_record].user_id == node_name_user_id)
				) {
					var newObject = JSON.parse(JSON.stringify(node_records[each_record]));
					return_object = {
						"result": newObject
					};
					break;
				}
			}
			callback(return_object);
		}
	},

	// search for node_name by combining name and user --  if no user_id then default to system
	search_node_name_by_user_name: function(user_id, node_name, callback) {
		//var return_object = error_definitions.error_not_authorized;
		if (!user_id) {
			user_id = system_id;
		} // system_id global
		this.search_node_id(user_id, node_name.replace(/\s/g, "_") + user_id, callback);
	},
	search_security: function(user_id, fn_name, portal_id, callback) {
		if (environment == "nodered") {
			var query = {
				selector: {
					"table": 	"node",
					"data_id": user_id,
					"data_id_lineage.data_id": {
						"$in": [portal_id]
					},
					"$or": [
						{
							"ancestors": {
								"$in" : [fn_name + system_id]
							}
						}, {
							"ancestors": {
								"$in" : [fn_name + portal_id]
							}
						}
					]
				}
			};
			
			db.searchRecordsFromDatabase(query, function(return_object){
				if(return_object){
					callback(return_object);
				}else{
					callback(error_definitions.error_not_authorized);
				}
			});
		}else{
			var return_object = error_definitions.error_not_authorized;
			for (var each_record in node_records) {
				if (node_records[each_record].table == "node" &&
					node_records[each_record].data_id == user_id &&
					node_records[each_record].data_id_lineage.data_id.indexOf(portal_id) >= 0 &&
					(node_records[each_record].ancestors.indexOf(fn_name + system_id) >= 0 || node_records[each_record].ancestors.indexOf(fn_name + portal_id) >= 0)
				) {
					return_object = {
						result: "authorized"
					};
					break;
				}
			}
			callback(return_object);
		}
	},
	arrayUnique: function(array) {
		var a = array.concat();
		for (var i = 0; i < a.length; ++i) {
			for (var j = i + 1; j < a.length; ++j) {
				if (a[i] === a[j])
					a.splice(j--, 1);
			}
		}
		return a;
	},
	// this splits an array of records into those that have any parents with external refs vs those that do not
	// does not have call back issue
	split_internal_external: function(tree_array, previous_object) {
		var each_ancestor;
		var each_record; // used loop to go through each record in tree array
		var this_ancestor; // used loop to go through each record in tree array
		var record_internal = true; // flag if the current record has external references or not
		var children_object = {}; // current record being processed
		var parents = []; // current parents of record being processed
		var ancestors = []; // current ancestors of record being processed
		var internal = []; // array of tree records with no outside references
		var external = []; // array of tree recrods with some outside references
		var external_object = {}; // object {id:id, id:id, id:id) of _ids that do not appear anywhere in the tree
		var external_array = []; // external_object in {id:{},id:{},id{}} format
		var tree_object = {}; // tree array in {id:{},id:{},id{}} format

		for (let each_record in tree_array) {
			if (tree_array[each_record]) {
				tree_object[tree_array[each_record]._id] = tree_array[each_record]._id;
			}
		} // first convert tree_array to tree_object

		tree_object[previous_object._id] = previous_object._id; // add previous object to it

		for (each_record in tree_array) // go through each item in tree
		{
			record_internal = true; // assume this rec will have only internal ref
			children_object = tree_array[each_record];
			ancestors = children_object.ancestors;
			parents = children_object.parents;
			for (each_ancestor in ancestors) // go through each ancestor in record
			{
				this_ancestor = ancestors[each_ancestor];
				if (!tree_object[this_ancestor]) // if it is NOT an internal object
				{
					record_internal = false; // set current record has external references
					if (parents.indexOf(this_ancestor) > -1) {
						external_object[this_ancestor] = this_ancestor;
					} // if current ancestor exists in parents then external
				}
			}
			if (record_internal) {
				internal.push(children_object);
			} else {
				external.push(children_object);
			} // based on check add into external or internal arrays
		}

		for (var key in external_object) {
			if (external_object.hasOwnProperty(key)) {
				external_array.push(key);
			}
		} // convert external object to array

		return {
			internal: internal,
			external: external,
			external_array: external_array
		};
	},

	add_date: function(hist_user_id, node_object) {
		if (!node_object.history) node_object.history = [];
		var temp = {};
		temp.user_id = hist_user_id;
		temp.date = new Date().toISOString();
		node_object.history.push(temp);
		return node_object;
	},
	generate_external_lineage: function(record, external_object, auth_data_id) {
		var return_object = {},
			parents_ancestors = [],
			parents_lineage = {}, //;
			external_ancestors = [],
			external_lineage = {}, //[];
			ancestors = record.ancestors,
			parent_id, parent_user_id;

		if (debug == 1) {
			console.log({
				record: record
			});
			console.log({
				external_object: external_object
			});
		}
		// generate external lineage based on ancestors, risk with parents is that immeidate parent is local, but all inside of parent is external
		for (var each_parent in ancestors) {

			if (external_object[ancestors[each_parent]]) {
				if (debug == 1) {
					console.log({
						external_object: external_object[ancestors[each_parent]]
					});
				}
				// now add each of the parents ancestors and data lineage to arrays 
				parent_id = external_object[ancestors[each_parent]]._id; // return_object._id;
				parent_user_id = external_object[ancestors[each_parent]].user_id;
				parents_ancestors = external_object[ancestors[each_parent]].ancestors; // return_object.ancestors;
				parents_lineage = external_object[ancestors[each_parent]].data_id_lineage; // return_object.data_id_lineage;


				if (parent_id) parents_ancestors.push(parent_id);

				if (auth_data_id && record.user_id != parent_user_id && parents_lineage.data_id.indexOf(record.user_id) < 0) {
					if (debug == 1) console.log({
						not: external_object[ancestors[each_parent]]
					});
					// security check, is my user_id mentioned in data_id (lineage?) or am I owner of parent also
					return_object = {
						error: error_definitions.error_not_authorized
					};
					break;
				}

				for (var each_record in parents_ancestors) {
					if (parents_ancestors[each_record]) {
						if (external_ancestors.indexOf(parents_ancestors[each_record]) < 0) {
							external_ancestors.push(parents_ancestors[each_record]);
						}
					}
				}

				for (var key in parents_lineage) { // {data_id:[item1, item2], key: [item3, item4]}
					if (parents_lineage.hasOwnProperty(key)) {
						var data_lineage = parents_lineage[key]; //[item3, item4] array
						for (var item in data_lineage) {
							if (data_lineage[item]) {
								if (!external_lineage[key]) external_lineage[key] = []; // create data_id,
								if (external_lineage[key].indexOf(data_lineage[item]) < 0) external_lineage[key].push(data_lineage[item]); // check for item in data_id, key
							}
						}
					}
				}
			}
		} // for each ancestor

		if (!return_object.error) {
			return_object = {};
			return_object.result = {};
			return_object.result.external_ancestors = external_ancestors;
			return_object.result.external_lineage = external_lineage;
		}

		if (debug == 1) {
			console.log({
				END_END: record._id,
				return: return_object.result
			});
		}
		return return_object;
	},
	subtract_lineage: function(obj1, obj2) {
		if (debug==1){console.log(obj1);}
		if (debug==1){console.log(obj2);}
		var return_object = {};//JSON.parse(JSON.stringify(obj1));
		for (var key in obj1) {
			if (obj1.hasOwnProperty(key)){
				if (obj2.hasOwnProperty(key)) { 
					return_object[key]= obj1[key].filter((x)=>{ return ( obj2[key].indexOf(x) < 0 ); });
				} else {
					return_object[key] = obj1[key];
				}
			}
		}
		if (debug==1){console.log(return_object);}
		return return_object;
	},
	update_tree_lineage: function(tree_array, external_object, mode, add_object, previous_object, auth_data_id) {
        console.log(">>>>>>>>>>>>>>>>>> inside update_tree_lineage ", add_object);
		var history_object = add_object.history[add_object.history.length - 1], // get last element of the array
			update_records = [],
			delete_records = [],
			return_object = {},
			node_object = {},
			exclude_ancestors = previous_object.ancestors.filter(x => add_object.ancestors.indexOf(x) < 0),
			include_ancestors = add_object.ancestors.filter(x => exclude_ancestors.indexOf(x) < 0),
			exclude_lineage = this.subtract_lineage(previous_object.data_id_lineage, add_object.data_id_lineage),
			//previous_object.data_id_lineage.filter(x => add_object.data_id_lineage.indexOf(x) < 0)
			include_lineage = this.subtract_lineage(add_object.data_id_lineage, exclude_lineage),
			//add_object.data_id_lineage.filter(x => exclude_lineage.indexOf(x) < 0)
			external_ancestors = {}, //[];
			external_lineage = {}; //[];

		// see diff between add_object vs previous_object 
		// exclude = previous - current, remove from future result then add external  
		// include = current - previous, add to future result

		// in the case of a rename, add new to include, remove old from exclude
		if (add_object._id != previous_object._id) {
			if (add_object._id && include_ancestors.indexOf(add_object._id) < 0) {
				include_ancestors.push(add_object._id);
			}
			if (previous_object._id && exclude_ancestors.indexOf(previous_object._id) < 0) {
				exclude_ancestors.push(previous_object._id);
			}
		}

		//if (previous_object.history.length>1){console.log({previous_object:previous_object})}
		if (debug == 1) console.log({
			"add_object": add_object
		});
		if (debug == 1) console.log({
			previous_object: JSON.parse(JSON.stringify(previous_object))
		});
		if (debug == 1) console.log({
			exclude_ancestors: exclude_ancestors
		});
		if (debug == 1) console.log({
			include_ancestors: include_ancestors
		});
		if (debug == 1) console.log({
			exclude_lineage: exclude_lineage
		});
		if (debug == 1) console.log({
			include_lineage: include_lineage
		});
		if (debug == 1) console.log({
			external_object: external_object
		});

		for (var each_record in tree_array) {
			node_object = tree_array[each_record];
			//if (node_object.data_id=="8e3384889429685de23b3b4226f13685"){debug=1}

			if (mode == "del") {
				// if external ancestors 1,2,3,4,5 and node parents 1,6 for del we want final node parents to be 1
				// i.e. find intersection of arrays external_ancestors to node_object.parents
				var j = 0,
					c = [];
				for (var i = 0; i < node_object.parents.length; ++i) {
					if (node_object.ancestors.indexOf(node_object.parents[i]) != -1) c[j++] = node_object.parents[i];
				}
				node_object.parents = c;
			}

			// get external lineage for node_object
			return_object = self.generate_external_lineage(node_object, external_object, auth_data_id); // generate external lineage of record based on its parents
			if (return_object.error) {
				break;
			} else {
				external_lineage = return_object.result.external_lineage;
				external_ancestors = return_object.result.external_ancestors;

				// ancestors = (record ancestors + overall include - overall exclude) + record ancestors
				node_object.ancestors = self.arrayUnique(node_object.ancestors.concat(include_ancestors).filter(function(x) {
					return exclude_ancestors.indexOf(x) < 0;
				}).concat(external_ancestors));

				var all = [node_object.data_id_lineage, include_lineage, exclude_lineage, external_lineage];
				var unique = this.arrayUnique(new Array([].concat.apply([], all.map(Object.keys)))[0]);

				if (debug == 1) console.log({
					all: all
				});
				if (debug == 1) console.log({
					unique: unique
				});
				for (var item in unique) {
					if (unique[item]) {
						var key = unique[item];
						if (debug == 1) console.log(key);
						if (debug == 1) console.log(node_object.data_id_lineage[key]);
						if (debug == 1) console.log(include_lineage[key]);
						if (debug == 1) console.log(exclude_lineage[key]);
						if (debug == 1) console.log(external_lineage[key]);

						if (!node_object.data_id_lineage.hasOwnProperty(key)) node_object.data_id_lineage[key] = [];
						if (!include_lineage.hasOwnProperty(key)) include_lineage[key] = [];
						if (!exclude_lineage.hasOwnProperty(key)) exclude_lineage[key] = [];
						if (!external_lineage.hasOwnProperty(key)) external_lineage[key] = [];

						node_object.data_id_lineage[key] = this.arrayUnique(node_object.data_id_lineage[key].concat(include_lineage[key]).filter(function(x) {
							return exclude_lineage[key].indexOf(x) < 0;
						}).concat(external_lineage[key]));
						if (node_object.data_id_lineage[key].length==0){delete node_object.data_id_lineage[key];}
					}

				}

				if (debug == 1) console.log({
					node_object: node_object
				});
				// if current record's parent refers to record being renamed then deal with, we do this AFTER external call
				if (add_object._id != previous_object._id) {
					var local_index = node_object.parents.indexOf(previous_object._id);
					if (local_index > -1) {
						node_object.parents.splice(local_index, 1);
						if (add_object._id && node_object.parents.indexOf(add_object._id) < 0) node_object.parents.push(add_object._id);
					}
				}

				// this should apply only to add object and to undo if (add_object._id != previous_object._id) 2nd above
				var index = node_object.ancestors.indexOf(node_object._id);
				if (index > -1) node_object.ancestors.splice(index, 1);

				//if (node_object._id == add_object._id) {console.log({HEREHERERERERERER:node_object})};
				//if (!history_object) {console.log("*********************** ERROR"); console.log(JSON.parse(JSON.stringify(node_object)))};

				if (history_object && node_object._id != add_object._id) node_object.history.push(history_object);

				if (mode == "del") { // if parents length = 0 and delete then add to delete 
					var empty = true;
					for (var local_key in external_lineage) {
						if (external_lineage.hasOwnProperty(local_key)) {
							if (external_lineage[local_key].length != 0) {
								empty = false;
								break;
							}
						}
					}
					if (empty) {
						delete_records.push(node_object);
					} else {
						update_records.push(node_object);
					}
				} else {
					update_records.push(node_object);
				}
			}
		}

		if (!return_object.error) {
			return_object = {
				delete_records: delete_records,
				update_records: update_records
			};
		}
		if (debug == 1) {
			console.log({
				return_object: return_object
			});
		}
		//debug=0;
		return return_object;
	},
	get_and_process_children: function(previous_object, mode, add_object, callback) {
		// get the whole tree
		// split tree into records external (records which ancestors that point to outside the tree) and internal 
		// Bulk read external records that will be needed to complete lineage
		// return fixed records to delete and save
		var external_object = {};
		var delete_records = [];
		var update_records = [];
		var node_id = previous_object._id;
		this.search_tree_deep(null, node_id, function(return_object) { // get all the children associated with previous_object
			if (!return_object.error) // if there was an error then return error
			{
				var tree_array = return_object.result; // tree_array holds all children

				return_object = self.split_internal_external(tree_array, previous_object); // split childrent to those with outside parents or not
				var internal = return_object.internal; // part of tree with internal references only
				var external = return_object.external; // part of tree that has outside references
				var external_array = return_object.external_array; // list of outside _ds we will need to read to complete lineage
				self.get_external_object(external_array, function(return_object) { // Bulk read the outside records

					if (return_object.result) {
						external_object = return_object.result; // save outside records in external_object {id:{}, id:{}, id:{}}
						return_object = self.update_tree_lineage(tree_array, external_object, mode, add_object, previous_object, false);

						if (debug == 1) console.log(return_object);
						if (!return_object.error) {
							var delete_records = return_object.delete_records;
							var update_records = return_object.update_records;
							if (mode != "del") // in case of delete we are done, we just need fix records with external references
							{
								update_records.push(add_object); // if delete make sure original object is deleted
							}

							if (mode != "add") {
								delete_records.push(previous_object); // make sure we save add_object
							}

							return_object = {
								delete_records: delete_records,
								update_records: update_records
							};
							callback(return_object);
						} else {
							callback(return_object);
						}
					} else {
						callback(return_object);
					}
				});
			} else {
				callback(return_object);
			}
		});
	},


	get_external_object: function(search_array, callback) {
		var temp = {};
		var return_object = {};
		var external_object = {};
		return_object.result = temp;

		if (search_array == undefined) search_array = [];
		if (search_array.length != 0) {
			if (debug == 2) console.log(search_array);
			this.search_bulk(search_array, function(return_object) {
				if (return_object.result && return_object.result.length != 0) {
					var external_array = return_object.result;
					// convert external records to {id:{},id:{},id{}} format
					for (var each_record in external_array) {
						if (external_array[each_record]) {
							external_object[external_array[each_record]._id] = external_array[each_record];
						}
					}
					callback({
						result: external_object
					});
				} else {
					callback(return_object); 
				}
			});
		} else {
			callback(return_object);
		}
	},

	// previous_object is the old object if any, if no previous object then blank fields
	// add object is the object as we would add to db, in case of delete _id blank
	process_tree: function(previous_object, mode, add_object, callback) {
		// process the records that get_and_process_children() returns by saving and or deleting
		var delete_records_records = [];
		var update_records = [];
		self.get_and_process_children(previous_object, mode, add_object, function(return_object) {
			if (debug == 1) console.log(return_object);
			if (!return_object.error) {
				delete_records = return_object.delete_records;
				update_records = return_object.update_records;
				if (debug == 1) console.log(update_records);
				//debug=0
				if (delete_records.length > 0) {
					self.delete_array(delete_records, function(return_object) {
						if (!return_object.error && update_records.length > 0) {
							self.save_array(update_records, function(return_object) {
								if (!return_object.error) {
									return_object = {
										result: {
											update_records: update_records,
											delete_records: delete_records
										}
									};
								}
								callback(return_object);
							});
						} else {
							callback(return_object);
						}
					});
				} else {
					if (!return_object.error && update_records.length > 0) {
						self.save_array(update_records, function(return_object) {
							if (debug == 1) {
								console.log(return_object);
							}
							if (!return_object.error) {
								return_object = {
									result: {
										update_records: update_records,
										delete_records: delete_records
									}
								};
							}
							callback(return_object);
						});
					} else {
						callback(return_object);
					}
				}
			} else {
				callback(return_object);
			}
		});
	},

	// renames record node_object to new_node name by deleting old and updating children
	// returns the new record created   
	rename_node: function(user_id, old_object, node_name, previous_object, callback) {
		var renamed_object;
		var new_node_id = node_name.replace(/\s/g, "_") + user_id; // change spaces to _ underscores, id = node_name+user_id
		self.search_node_id(user_id, new_node_id, function(return_object) // see if new node with new name exists
			{
				if (return_object.result) // if it did exist,
				{
					renamed_object = JSON.parse(JSON.stringify(return_object.result));
					self.process_tree(previous_object, "rename", renamed_object, callback);
				} else // did not exist
				{
					renamed_object = JSON.parse(JSON.stringify(old_object)); // make a copy of old_object
					renamed_object._id = new_node_id; // change _id  and node_name
					renamed_object.node_name = node_name; // otherwise all the same
					self.save_node(renamed_object, function(return_object) // create based on old one, but change _id and node_name  
						{
							if (return_object.result) // we did this so we could have an _id before calling process tree
							{
								renamed_object = return_object.result; // updating the new renamed_object which we saved into database. this is required for _rev updated values.
								self.process_tree(previous_object, "rename", renamed_object, function(return_object) {
									if (return_object.result) {
										return_object = {
											result: renamed_object
										};
									}
									callback(return_object);
								});
							} else {
								callback(return_object);
							}
						});
				}
			});
	},
	// calls create_edit_node ... can send differences of parents rather than absolute
	edit_node: function(user_id, node_id, data_id, node_name, include_parents, remove_parents, remove_data_id_flag, remove_node_name_flag, auth_data_id, hist_user_id, callback) {
        var self = this;
		this.search_node_id(user_id, node_id, function(return_object) {
			if (!return_object.error) {
				var node_object = return_object.result;
				var new_data_id = node_object.data_id;
				var new_node_name = node_object.node_name;
				var parents = node_object.parents;
				if (remove_data_id_flag) {
					new_data_id = null;
				}
				if (remove_nodename_id_flag) {
					new_node_name = null;
				}
				parents = self.arrayUnique(concat(include_parents).filter(x => remove_parents.indexOf(x) < 0));
				self.create_edit_node(user_id, node_id, new_data_id, parents, new_node_name, auth_data_id, hist_user_id, null, callback);
			} else {
				callback(return_object);
			}
		});
	},
	create_edit_node: function(user_id, node_id, data_id, parents, node_name, auth_data_id, hist_user_id, data_id_plus, callback) {
	    //if (node_id=="get_pagef1b5ed9577f69c6b131d94a46b39044f"){debug=1}
		if (debug == 1) {
			console.log(arguments);
		}
		if (debug == 1) console.log(typeof(callback) == "function");
		if (!data_id_plus) data_id_plus = {};
		if (!hist_user_id) hist_user_id = user_id;

		if (parents.length == 0) parents_same = true;
		else {
			parents_same = false;
		}
		var parents_same, previous_object, node_object, return_object = {},
			node_sent_in = false;
		if (!auth_data_id) auth_data_id = false;
		if (!parents) parents = [];
		if (data_id == "") data_id = null;
		if (!node_name) node_name = "";
		if (node_id == "") node_id = null;
		if (node_id) node_sent_in = true;
		if (!node_id && node_name != "") node_id = node_name.replace(/\s/g, "_") + user_id; // generate a new id based on name...remove spaces add userid
		if (node_sent_in) {
			if (debug == 1) console.log(JSON.parse(JSON.stringify(node_id)));
			self.search_node_id(user_id, node_id, function(return_object) {
				if (debug == 1) console.log(JSON.parse(JSON.stringify(return_object)));
				if (return_object.result) {
					previous_object = return_object.result; // keep a copy on how the node used to look
					node_object = JSON.parse(JSON.stringify(previous_object));
					if (debug == 1) console.log(JSON.parse(JSON.stringify(node_object)));
					if (debug == 1) console.log(JSON.parse(JSON.stringify(node_object)));

					if (debug == 1) console.log(data_id_plus);
					//node_object.data_id_lineage = Object.assign(node_object.data_id_lineage, data_id_plus);
					if (data_id_plus!={}){
						for (var each_data_lienage in node_object.data_id_lineage) {
							if (node_object.data_id_lineage.hasOwnProperty(each_data_lienage)) {
								for (var each_data_id_plus in data_id_plus){
									 if (data_id_plus.hasOwnProperty(each_data_id_plus) && each_data_lienage==each_data_id_plus)
									 {
										node_object.data_id_lineage[each_data_lienage]=self.arrayUnique(data_id_plus[each_data_id_plus], node_object.data_id_lineage[each_data_lienage]);
									} 
								}
							}
						}
					}

					if (data_id){
						node_object.data_id_lineage.data_id=[data_id];
						//if (node_object.data_id_lineage.data_id.indexOf(data_id)<0) {node_object.data_id_lineage.data_id.push(data_id)};
						node_object.data_id = data_id;	
					}else {
						node_object.data_id_lineage.data_id=[];
					}
						

					if (debug == 1) console.log(node_object.data_id_lineage);

					//node_object.data_id = data_id;
					node_object = self.add_date(hist_user_id, node_object);
					//if (data_id){node_object.data_id_lineage.data_id=[data_id]}else{node_object.data_id_lineage.data_id=[]}

					// check to see existing parents are exacly like incoming parents
					parents_same = (previous_object.parents.length == parents.length) && previous_object.parents.every(function(element, index) {
						return element === parents[index];
					});

					if (!parents_same) {						// if !parents_same then force update_tree_lineage to replentish  
						node_object.parents = parents; 			// set node_object.parents to incoming parents
						node_object.ancestors = parents; 		// gut ancestors, will be replentished
					}											// else keep what was there 
					else
					{
						if (data_id && node_object.data_id_lineage.data_id.indexOf(data_id)<0) {node_object.data_id_lineage.data_id.push(data_id);}
					}
										

					self.continue_step2(user_id, data_id, node_name, parents_same, previous_object, node_object, parents, auth_data_id, node_sent_in, callback);
					// previous_object = return_object.result; // keep a copy on how the node used to look
					// node_object = JSON.parse(JSON.stringify(previous_object));

					// if (debug == 1) console.log(JSON.parse(JSON.stringify(node_object)));

					// // check to see existing parents are exacly like incoming parents
					// parents_same = (previous_object.parents.length == parents.length) && previous_object.parents.every(function(element, index) {
					// 	return element === parents[index];
					// });
					// if (data_id) data_id_plus.data_id = [data_id];
					// else data_id_plus.data_id = [];

					// node_object.data_id_lineage = data_id_plus;
					// node_object.data_id = data_id;
					// //if (data_id){node_object.data_id_lineage.data_id=[data_id]}else{node_object.data_id_lineage.data_id=[]}
					// node_object.parents = parents; // set node_object.parents
					// node_object.ancestors = parents; // gut ancestors, call to update_tree_lineage will replentish   
					// node_object = self.add_date(hist_user_id, node_object);
					// self.continue_step2(user_id, data_id, node_name, parents_same, previous_object, node_object, parents, auth_data_id, node_sent_in, callback);
				} //user_id, data_id, node_name, parents_same, previous_object, node_object, parents, auth_data_id, node_sent_in, callback){
				else {
					callback(return_object);
				}
			});
		} else // no node_sent in set previous object to empty
		{
			previous_object = {};
			previous_object._id = null;
			previous_object.table = "node";
			previous_object.user_id = user_id;
			previous_object.node_name = null;
			previous_object.parents = [];
			previous_object.ancestors = [];
			previous_object.data_id = null;
			previous_object.data_id_lineage = {};
			previous_object.data_id_lineage.data_id = [];
			previous_object.history = []; //++

			node_object = {};
			node_object._id = node_id;
			node_object.table = "node";
			node_object.user_id = user_id;
			node_object.node_name = node_name;
			node_object.ancestors = parents;
			node_object.data_id = data_id;
			node_object.parents = parents;
			node_object.data_id_lineage = {};
			data_id_plus.data_id = [];
			//node_object.data_id_lineage.data_id=[];
			//if (data_id) {node_object.data_id_lineage.data_id=[data_id]};
			if (data_id) data_id_plus.data_id = [data_id];
			node_object.data_id_lineage = data_id_plus;
			node_object = self.add_date(hist_user_id, node_object);
			self.continue_step2(user_id, data_id, node_name, parents_same, previous_object, node_object, parents, auth_data_id, node_sent_in, callback);
		}
	},
	continue_step2: function(user_id, data_id, node_name, parents_same, previous_object, node_object, parents, auth_data_id, node_sent_in, callback) {
		if (debug == 1) console.log(typeof(callback) == "function");
		if (debug == 1) console.log(JSON.parse(JSON.stringify(node_object)));
		if (debug == 1) console.log(data_id);
		//if (!return_object.error && data_id) 
		this.search_node_id(null, data_id, function(return_object) //check if data_id exists
			{
				if (debug == 1) console.log(return_object);
				if (!return_object.error) {
					if (!parents_same) { // if old and new parents DID change
						var external_object = {};
						if (debug == 1) console.log(parents);
						self.get_external_object(parents, function(return_object) // get the records associated with parents
							{
								if (debug == 1) console.log(return_object);
								if (return_object.result) { // now fix records ancestors and lineage
									external_object = return_object.result;
									if (debug == 1) console.log(JSON.parse(JSON.stringify(auth_data_id)));
									return_object = self.update_tree_lineage([node_object], external_object, "add", node_object, previous_object, auth_data_id);
									if (!return_object.error) {
										node_object = return_object.update_records[0];
										self.continue_step3(user_id, previous_object, node_object, node_name, node_sent_in, callback);
									} else {
										callback(return_object);
									}
								} else {
									callback(return_object);
								}
							});
					} else {
						self.continue_step3(user_id, previous_object, node_object, node_name, node_sent_in, callback);
					}
				} else {
					callback(return_object);
				}
			});
	},
	continue_step3: function(user_id, previous_object, node_object, node_name, node_sent_in, callback) {
		if (debug == 1) console.log(typeof(callback) == "function");
		if (node_object.node_name != node_name) { // if it is a rename
			if (debug == 1) console.log(node_name);
			self.rename_node(user_id, node_object, node_name, previous_object, callback);
		} else if (node_sent_in) { // if node sent in assume there is children to fix
			self.process_tree(previous_object, "add", node_object, callback);
		} else {
			self.save_node(node_object, callback); // simple save
		}
	},
	// function deletes tree deeply based node_id...must be owned by user_id
	delete_node: function(user_id, node_id, hist_user_id, callback) {
		if (!hist_user_id) {
			hist_user_id = user_id;
		}
        
		var data_id;
		var add_object = {};
		if (user_id == "") {
			user_id = null;
		}
        //console.log("herer>>>>>>>>>>", user_id, node_id);
		this.search_node_id(user_id, node_id, function(return_object) {
            //console.log("herer>>>>>>>>>>", return_object);
			if (debug == 1) console.log(JSON.parse(JSON.stringify(return_object)));
			if (return_object.result) // node has to exist in order to delete
			{
				add_object = return_object.result;
				data_id = add_object._id;
                
                //console.log(">>>>>>>>>>>>>>>>>> before 2nd searchId", data_id);
				self.search_data_id(data_id, function(return_object){ // see if node is a data_id anyplace
                    //console.log("2nd search result >>>>>><<<<<<<", return_object);
                    if (return_object.result) {
                        var previous_object = JSON.parse(JSON.stringify(add_object)); // previous record is a "copy" of what we read in
                        add_object = self.add_date(hist_user_id, add_object); // for the records that are just updated
                        add_object.data_id = null;
                        add_object.parents = [];
                        add_object.data_id_lineage = {};
                        add_object.data_id_lineage.data_id = [];
                        add_object.ancestors = [];
                        add_object._id = null;
                        self.process_tree(previous_object, "del", add_object, function(return_object1) {
                            callback(return_object1);
                        });
                    } else {
                        callback(error_definitions.error_data_id);
                    }
                });
			}else{
                callback(error_definitions.error_delete_error);
            }
		});
	},
	/**
	 *  @arguments 
	 *  user_id         = String;
	 *  portal_id       = String;
	 *  node_name       = String;
	 *  data_id         = String;
	 *  master_parents  = Array;
	 *  tree_owner_id   = String;
	 *  node_id         = String; 
	 **/
	// master_parents
	// -id      master_parents 
	// -user_id zzz
	// -data_id www
	//      grand parent 
	//      -user_id www - tree owner id is who owns the grand_parent record with the node_name in it
	//      -data_id www - on the grand_parent user_id and data_id are the same
	//      -node_name name
	//          parent 
	//          -user_id www ie tree owner id
	//          -data_id xxx ie portal_id
	//              child
	//              -user_id xxx ie portal_id
	//              -data_id yyy
	//                  sub child - user yyy authorized zzz, user_id remains portal xxx
	//                  -user_id xxx ie portal_id
	//                  -data_id zzz
	//
	// add or edit a grand parent or parent or child by node_name owned by tree_owner_id
	// add a grand parent node name to a master parent id  (security master parent.data_id = portal_id)
	// OR
	// search for right tree based on tree owner id and node name
	// create a grand parent node_name OR if grand parent already created then
	//          user and data id are portal id
	// add parent to related grand parent node name OR if parent already created then
	//          data id of grand parent must match portal id 
	//          data id of parent is what is being added
	// add child to parent related to grand parent node name
	//          data id of parent must match portal id
	//          data id of child is what is being added
	// 
	// we will check if user_id is authorized by portal_id to do this action
	// we further check to see if portal_id is authorized by tree_owner_id to do this action
	// tree_owner_id is who owns the grand_parent record with the node_name in it
	// if node_name is sent in we are attempting to create a grand_parent
	// data_id authorizes childs to the use of the node being created
	// master_parents is a way to add yourself to an existing node (security master parent.data_id = portal_id)
	// node_id: if null then create else edit
	add_to_node_name_tree: function(user_id, portal_id, node_name, data_id, master_parents, tree_owner_id, node_id, target, parent_node_name, callback) {
		//console.log({arguments:arguments})
		if (debug == 2) console.log({
			arguments: arguments
		});
		if (node_id == "") {
			node_id = null;
		}
		if (!master_parents) {
			master_parents = [];
		}
		if (node_name == "") {
			node_name = null;
		}
		if (tree_owner_id == "") {
			tree_owner_id = null;
		}
		if (!tree_owner_id) {
			tree_owner_id = system_id;
		} // assume system node name if not sent in
		if (data_id == "") {
			data_id = null;
		}
		if (!data_id) {
			return_object = error_definitions.error_data_id;
		} // data_id must exist
		if (!portal_id) {
			portal_id = user_id;
		}

		var data_id_plus = {};
		var create_name;
		if (debug == 2) console.log("before");
		self.security_check(user_id, "add_to_node_name_tree", portal_id, function(isAuthorized) {
			if (debug == 2) console.log("after");
			if (isAuthorized) {
				if (debug == 2) console.log("after authorized");
				if (node_id) {
					if (debug == 2) console.log(node_id);
					var return_object = {};
					if (node_id != node_name.replace(/\s/g, "_") + portal_id) {
						return_object = error_definitions.error_node_name;
					}
					if (!data_id) {
						return_object = error_definitions.error_data_id;
					} // if node_id record existed, then data_id needs to exist 
					if (debug == 2) console.log(JSON.parse(JSON.stringify(return_object)));
					if (return_object.error) {
						callback(return_object);
					} else {
						self.search_node_id(portal_id, node_id, function(search_object) { // try to get the node
							if (debug == 2) console.log(search_object);
							if (search_object.result) { // if found get arguments from result // if current node does not have a node_name then // we cannot introduce a node_name here, we can rename though
								create_name = search_object.result.node_name;
								if (create_name && node_name) create_name = node_name;
								if (!data_id) data_id = search_object.result.data_id; // adopt from existing
								master_parents = self.arrayUnique(search_object.result.parents.concat(master_parents));
								if (!create_name && node_name) {
									callback(error_definitions.error_node_name); // use rename
								} else {
									self.create_edit_node(search_object.result.user_id, node_id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
								}
							}
						});
					}
				} else // if !node_id
				{
					self.add_name_step2(user_id, portal_id, node_name, data_id, master_parents, tree_owner_id, node_id, data_id_plus, target, parent_node_name, callback);
				}
			} else {
				callback(error_definitions.error_not_authorized);
			}

		});
	},
	add_name_step2: function(user_id, portal_id, node_name, data_id, master_parents, tree_owner_id, node_id, data_id_plus, target, parent_node_name, callback) {
		var return_object = {};
		var node_id=null;
		this.search_node_name_by_user_name(tree_owner_id, node_name, function(grand_object) { // see if a node name owned by tree_owner_id already exists
			if (debug == 2) console.log({
				grand_object: grand_object
			});
			if (grand_object.error || target=="grand") { 						// if none there or traget = grand, then we can add a grandparent
				if (grand_object.result){node_id=grand_object.result._id;}
				var create_name = node_name; // only grand_parents have node_name
				if (portal_id != data_id || portal_id != tree_owner_id) {return_object = error_definitions.error_data_portal;}
				
				if (debug == 2) console.log({
					portal_id: portal_id,
					data_id: data_id,
					tree_owner_id: tree_owner_id,
					return_object: return_object
				});

				if (!return_object.error) {
					self.create_edit_node(tree_owner_id, node_id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
				} else {
					callback(return_object);
				}
			} else {																						// there was a grand parent                                                             
				grand_object = grand_object.result;
				// PARENT
				// find parent > search tree grand_object._id where in portal id = data_id, 
				// and grand.data_id (tree_owner_id) is the owner of that record
				var creator_node_id = grand_object._id;
				var authorizing_id = tree_owner_id; 
				var authorized_id;
				var parent_node_name;
				if (tree_owner_id == portal_id) {
					authorized_id = data_id;
				} else {
					authorized_id = portal_id;
				}
				data_id_plus[portal_id] = [node_name];
				self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, node_name, true, parent_node_name, function(parent_object) {
					if (debug == 2) console.log({
						parent_object: parent_object
					});

					if (portal_id == tree_owner_id && (!parent_object.result || target=="parent")) { 
						 // if no parent then add // before we add, do a check?
						if (parent_object.result) {
							parent_object = parent_object.result;
							node_id=parent_object._id;
							master_parents = self.arrayUnique(parent_object.parents.concat(grand_object._id));
						} // edit
						else {
							master_parents = [grand_object._id]; // we are adding parent to the grand parent // create name will be blank
						}
						//if (portal_id == data_id || portal_id != grand_object.data_id){
						if (portal_id != grand_object.data_id){
							callback(error_definitions.error_data_portal);
						} else {
							//debug=1;
							self.create_edit_node(grand_object.data_id, node_id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
						}
					} else { // if portal_id!=tree_owner_id find parent so we can find child
						if (parent_object.result) { // PARENT
							
							parent_object = parent_object.result;
							parent_id = parent_object._id; // set to search inside parent id // see if duplicate child data_id is being added // find child > search tree parent_id where in data_id = data_id,  // and parent_object.data_id is the owner of that record
							creator_node_id = parent_object._id;
							authorizing_id = parent_object.data_id;
							authorized_id = data_id;
							parent_node_name = parent_object.node_name;

							if (debug == 2) console.log(parent_object.data_id);
							if (debug == 2) console.log(data_id);
							
							self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, node_name, false, parent_node_name, function(child_object) {
								if (debug == 2) console.log({
									child_object: child_object
								});
								
								// no need to check for target child ie default
								if (!child_object.result) // ||  target=="child") // child did not exist or target = child, then add/edit
								{ 
									master_parents = [parent_id]; // set right master parent id.  create name will be blank
									if (child_object.result){
										node_id=child_object.result._id;
									}
									if (portal_id == data_id || portal_id != parent_object.data_id) {  
										return_object = error_definitions.error_data_portal;
									}                     
									self.create_edit_node(parent_object.data_id, node_id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
								}
								else
								{ 	// CHILD existed, only master parents or data_id plus could be changing.
									//child_object = child_object.result;
									//master_parents = self.arrayUnique( child_object.parents.concat(parent_id));
									//self.create_edit_node(parent_object.data_id, child_object._id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
                                    child_object = child_object.result;
									data_id_plus = child_object.data_id_lineage;

									if (!data_id_plus[portal_id]){data_id_plus[portal_id]=[];}
									if (
										data_id_plus[portal_id].indexOf(node_name) < 0)
									{
										data_id_plus[portal_id].push(node_name);
									}
									master_parents = self.arrayUnique( child_object.parents.concat(parent_id));
									self.create_edit_node(parent_object.data_id, child_object._id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);

									// if (child_object.ancestors.indexOf(grand_object._id) < 0) { // if child existed but intance did not
									// 	master_parents = self.arrayUnique(child_object.parents.concat(parent_id));
									// 	if (debug == 2) console.log({master_parents: master_parents});
									// 	self.create_edit_node(parent_object.data_id, child_object._id, data_id, master_parents, create_name, true, user_id, data_id_plus, callback);
									// } else {
									// 	return_object = error_definitions.error_duplicate; // child existed exactly then duplicate
									// 	callback(return_object);
									// }
								} 
							});
						} else {
							callback(parent_object);
						}
					}
				});
			}
		});
	},

	// delete a node by node_id OR
	// delete a node by node_name owned by tree_owner_id
	// first sees if grand parent - data_id = portal_id = tree_owner_id must match records data_id & user_id
	// then parent data_id = portal_id must match records data_id
	// then child data_id match records data_id
	//
	// tree     portal      data
	//  x          x          x     =    Grand
	//             x          x     =    Parent
	//                        x     =    Child
	// &&&&& callback processing not done
	delete_from_node_name_tree: function(user_id, portal_id, node_name, data_id, tree_owner_id, node_id, target, parent_node_name, callback) {
        //console.log("comes in delete method >>> ", user_id, portal_id, node_name, data_id, tree_owner_id, node_id, target, parent_node_name);
        //debug = 2 ;
		var data_id_plus = {};
		if (debug == 2) console.log({
			arguments: arguments
		});
		var return_object = {};
		if (!data_id) {
			return_object = error_definitions.error_data_id;
		} // data_id must exist
        
       // console.log("this>>>>>>>>>>>>", self);
		self.security_check(user_id, "delete_from_node_name_tree", portal_id, function(isAuthorized) {
			if (!return_object.error && isAuthorized) {
				if (debug == 2) console.log("past security");
				if (!node_name && node_id) {
					if (debug == 2) console.log(node_id);
					self.delete_node(portal_id, node_id, user_id, callback); // case of just deleting a node
				} else {
					self.search_node_name_by_user_name(tree_owner_id, node_name, function(return_object) {

						if (debug == 2) console.log({return_object});

						if (return_object.result) { // if grand parent found
							// grand.data_id = grand_user_id = tree_owner_id = portal_id = data_id
							var grand_object = return_object.result;
							// should alwasy be equal to tree_owner_id
							if (target=="grand" ||
								(portal_id == grand_object.user_id && 
								data_id == grand_object.data_id && 
								portal_id == data_id))
							{
								if (debug == 2) console.log(grand_object);
								self.delete_node(portal_id, grand_object._id, user_id, callback); // only delete if ownership matches user_id, node_id
							} else { // check to see if parent
								// find parent > search tree grand_parent_id where in portal_id = data_id, 
								// and parent_user_id is the owner of that record 
                                if (debug == 2) console.log("Comes in else case111111 ......");
								var creator_node_id = grand_object._id;
								var authorizing_id = tree_owner_id; 
								var authorized_id; 

								if (tree_owner_id == portal_id) {
									authorized_id = data_id;
								} else {
									authorized_id = portal_id;
								}
								self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, node_name, true, parent_node_name, function(return_object) {

									if (debug == 2) console.log({return_object});
                                    if (debug == 2) console.log("Comes in else 22222222222 ......");
                                    
									if (return_object.result) {
										var parent_object = return_object.result;
										if (portal_id == tree_owner_id || target=="parent") {
											if (debug == 2) console.log({
												return_object
											});
                                            
                                            //console.log(">?>>>>>>>>>>>>>>>");
											self.delete_node(parent_object.user_id, parent_object._id, user_id, callback);
										} else {
											creator_node_id = parent_object._id;
											authorizing_id = parent_object.data_id;
											authorized_id = data_id;
											self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, node_name, false, parent_node_name, function(return_object) {
                                                if (debug == 2) console.log("Comes in else case333333333 ......");
												if (debug == 2) console.log({
													return_object
												});
												//if (!return_object.result || target=="child") //changed on 07/022018 when trying to implement code as api-endpoit for app.
                                                if (!return_object.result) 
												{
                                                    console.log("Comes in this case before going to return error >>>>>>>>>", !return_object.result, target);
													callback(error_definitions.error_empty);
												}
												else
												{
													var child_object = return_object.result;
													var index = child_object.parents.indexOf(parent_object._id);
													if (index > -1) {
														child_object.parents.splice(index, 1);
														self.create_edit_node(child_object.user_id, child_object._id, child_object.data_id, child_object.parents, child_object.node_name, true, user_id, data_id_plus, function(local_return_object) {

															if (debug == 2) console.log({
																local_return_object
															});
															if (local_return_object.result && child_object.parents.length == 0) {
																if (debug == 2) console.log({
																	local_return_object
																});
																self.delete_node(portal_id, child_object._id, user_id, callback);
															} else {
																callback(local_return_object);
															}
														});
													} 
												}
											});
										}
									}else{
                                        callback(error_definitions.error_data_id);
                                    }
								});
							}
						}else{
                            callback(error_definitions.error_data_id);
                        }
					}); // search for grand parent
				}
			} else {
				callback(return_object);
			}
		});
	},
	//you must be owner of node
	list_node_children: function(head_object, data, deep, user_wild, include_head, callback) {
		if (debug == 2) console.log(typeof(callback) == "function");
		var return_array = [];
		var node_object = {};
		var return_object = {};
		if (data == "") {
			data = null;
		}
		if (deep == "") {
			deep = null;
		}
		if (user_wild == "") {
			user_wild = null;
		}

		if (debug == 2) console.log(JSON.parse(JSON.stringify(head_object)));
		var user_search_id = head_object.user_id;
		var node_id = head_object._id;
		if (user_wild) {
			user_search_id = null;
		}
		var temp_fn;
		if (deep) {
			temp_fn = self.search_tree_deep;
		} else {
			temp_fn = self.search_children;
		}
		temp_fn(user_search_id, node_id, function(return_object) {
			if (debug == 2) console.log(return_object);
			if (!return_object.error) {
				if (data) // get array related to data_id of current array
				{
					return_array = return_object.result;
					var temp = [];
					for (var each_record in return_array) {
						if (return_array[each_record].data_id) {
							temp.push(return_array[each_record].data_id);
						}
					}
					if (temp.length != 0) {
						self.search_bulk(temp, function(return_object) {
							if (!return_object.error && include_head) {
								return_object.result.unshift(head_object);
								callback(return_object);
							} else {
								callback(return_object);
							}
						});
					} else {
						if (!return_object.error && include_head) {
							return_object.result.unshift(head_object);
							callback(return_object);
						} else {
							callback(return_object);
						}
					}
				} else // !data
				{
					if (debug == 2) console.log(return_object);
					if (!return_object.error && include_head) {
						return_object.result.unshift(head_object);
						if (debug == 2) console.log(return_object);
						callback(return_object);
					} else {
						callback(return_object);
					}
				}
			} else callback(return_object);
		});
	},

	// ** check sub_owner_for sec
	// First search for top of tree by node_name owned by tree_owner_id (if tree_owner_id null the default system_id)
	// Then if tree_owner_id==data_id then done
	//      else if tree_owner_id!=data_id then search for node that contains data_id in data_id
	// if sub_owner_id is sent in, then that is the owner of the sub tree, else wild
	get_tree_id: function(tree_owner_id, data_id, node_name, sub_owner_id, callback) { //system_id, portal_id, fn_name, system_id
		if (debug == 2) console.log(typeof(callback) == "function");
		if (debug == 2) console.log({
			arguments: arguments
		});
		var return_object;
		if (sub_owner_id == "") {
			sub_owner_id = null;
		}
		
		self.search_node_name_by_user_name(tree_owner_id, node_name, function(return_object) {
			if (debug == 2) console.log(return_object);
			if (return_object.result && (tree_owner_id != data_id)) // if tree_owner_id=data_id then this an instance or a creation of instance 
			{
				var node_id = return_object.result._id;
				if (debug == 2) console.log({
					data_id: data_id
				});
				if (debug == 2) console.log({
					node_id: node_id
				});
				if (debug == 2) console.log({
					sub_owner_id: sub_owner_id
				});
				self.search_tree_data_id(node_id, data_id, sub_owner_id, node_name, callback);
				//node_id, data_id, node_name_user_id, node_name, callback)
			} else {
				callback(return_object);
			}
		});
	},

	// return the tree by node_name
	get_node_name_tree: function(user_id, portal_id, node_name, include_data, include_head, tree_owner_id, callback) {
		if (debug == 2) console.log(typeof(callback) == "function");
		if (debug == 1) console.log({
			arguments: arguments
		});
		//var return_object={};
		self.security_check(user_id, "get_node_name_tree", portal_id, function(obj) {
			if (obj) {
				if (debug == 2) {
					console.log("after sec, before get tree");
				}
				self.get_tree_id(tree_owner_id, portal_id, node_name, tree_owner_id, function(return_object) {
					//debugger;
					if (debug == 2) {
						console.log({
							return_object: return_object
						});
					}

					if (return_object.result) {
						var node_object = return_object.result;
						var node_id = node_object._id;
						var deep = true;
						var user_wild = true;
						self.list_node_children(node_object, include_data, deep, user_wild, include_head, function(return_object2) {
							if (debug == 2) {
								console.log({
									return_object: return_object2
								});
							}
							if (return_object2 == error_definitions.error_empty) {
								return_object2 = {
									result: []
								};
							}
							callback(return_object2);
						});
					} else {
						callback(return_object);
					}
				});
			} else {
				callback(error_definitions.error_not_authorized);
			}
		});
	},


	// get user permissions based on portal (or accept) ie data_id_lineage[portal_id] && user_id = portal_id
	// get records where data_id_lineage[page_id] in what user sends in & user_id = page_id
	get_page: function(user_id, portal_id, page_id, filter, callback) {
		if (!filter) {
			filter=null;	
			if (debug==1) console.log("arrived to get page");													// if no user filter came in then get it
			self.get_user_filter(user_id, portal_id, filter, function(return_object){		// find where this user_id is in data_id owned by portal_id
				if (debug==1) console.log(return_object);
				if (return_object.result && return_object.result.length==1){
					filter = return_object.result[0].data_id_lineage[portal_id];				// the permissions portal_id gave to this user_d
					//if more than 1 then error
					self.get_page2(page_id, filter, callback);
				} else {
					callback(return_object);
				}	
			});
		} else {// if filter was sent in 
			self.get_page2(page_id, filter, callback);
		}
	},

	get_page2: function(page_id, filter, callback) {	// now go the right pages
		if (debug==1) console.log({get_page2: filter});
		self.get_details_based_on_filter(null, page_id, filter, function(return_object){// records owned system_id
			if (debug==1) console.log(return_object);
			if (return_object.result){
				var return_array=return_object.result;
				var temp = [];
				for (var each_record in return_array) {
					if (return_array[each_record].data_id) {
						temp.push(return_array[each_record].data_id);
					}
				}
				self.search_bulk(temp, callback);
			}
			else{
				callback(return_object);
			}
		});
	},
	// ++we need to think further about secuirty -- this current simple version may have a hack arount it
	// the more complex version would need to be re-written to handle 
	security_check: function(user_id, fn_name, portal_id, callback) {
		if (user_id != system_id) {
			this.search_security(user_id, fn_name, portal_id, function(return_object) {
				if (!return_object.error) {
					callback(true);
				} else {
					callback(false);
				}
			});
		} else {
			callback(true);
		}
	},
	search_data_id: function(data_id, callback) {
		var return_object;
	
		if (environment == "nodered") {
			db.searchNodeById(data_id, function(data){
				var node_object = data;
				if (node_object) {
					var newObject = JSON.parse(JSON.stringify(node_object));
					callback({"result": newObject});
				} else {
					callback(error_definitions.error_empty);
				}
			});
		} else {
            
            for (var each_record in node_records) {
                if (node_records[each_record].data_id == data_id) {
                    var newObject = JSON.parse(JSON.stringify(node_records[each_record]));
                    return_object = {
                        "result": newObject
                    };
                    break;
                }
            }
            if (return_object) {
                callback(return_object);
            } else {
                callback(error_definitions.error_empty);
            }
        }
	}
};


module.exports = treeObject ;