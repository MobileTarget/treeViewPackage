var axios 			    = require('axios'),
    error_definitions   = require('./error_definations'),
    node_records        = {},
    system_id           = "f1b5ed9577f69c6b131d94a46b39044f",
    self;

module.exports = {
    init: function(){
        console.log("comes inside the init method of helper file", this);
        self = this ;  
    },
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
        self = this;
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
        self = this;
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
    },
    
    /**
     *  basically the following declared function were used to process_message for which the whole treeView cloudant node
     *  is created and the method are originally written by Roger Colburn.
     **/
    
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
    add_to_node_name_tree: function(){
        var data_id_plus={}, return_object={}, //=error_definitions.error_not_authorized;
            create_name;
        
        if (this.node_id == "") this.node_id = null;
        if (!this.master_parents) this.master_parents = [];
        if (this.node_name == "") this.node_name = null;
        if (this.tree_owner_id == "") this.tree_owner_id = null ;
        if (!this.tree_owner_id) this.tree_owner_id = system_id ;			// assume system node name if not sent in
        if (this.data_id=="") this.data_id = null;
        if (!this.data_id) return_object = error_definitions.error_data_id;	// data_id must exist
        if (!this.portal_id) this.portal_id = this.user_id;
    
        if ( self.security_check(user_id, "add_to_node_name_tree", portal_id) ) {
            if (this.node_id) {	
                if (this.node_id != this.node_name.replace(/\s/g, "_") + this.portal_id ) {
                    return_object = {error:error_definitions.error_node_name} ;
                }
                
                if (!return_object.error) {
                    return_object = self.search_node_id(portal_id, node_id);
                }	// try to get the node
                
                if (return_object.result){	// if current node does not have a node_name then 
                    
                    // we cannot introduce a node_name here, we can rename though
                    create_name = return_object.result.node_name;
                    if (create_name && this.node_name) create_name = this.node_name ;
                    
                    if (!this.data_id) this.data_id = return_object.result.data_id;				// adopt from existing
                    
                    this.master_parents = self.arrayUnique(return_object.result.parents.concat(this.master_parents));
                    
                    if (!create_name && this.node_name) return_object = error_definitions.error_node_name; 	// use rename

                    return_object = self.create_edit_node(return_object.result.user_id, this.node_id, this.data_id, this.master_parents, create_name, true, this.user_id, data_id_plus);
                }
            }else if (!this.data_id){
                return_object = { error:error_definitions.error_data_id };
            }else {	// if node_id record existed, then data_id needs to exist							 
                var grand_object = self.search_node_name_by_user_name(this.tree_owner_id, this.node_name); // see if a node name owned by tree_owner_id already exists
                if (grand_object.error){ // if none there, then we can add a grandparent
                    create_name = this.node_name;   // GRANDPARENT did NOT exist, we can create
                    
                    // only grand_parents have node_name
                    // we leave master_parents to what came in
                    // creating a new node_name grand_parent	;	
                    if (this.portal_id != this.data_id || this.portal_id != this.tree_owner_id){
                        return_object = {error:error_definitions.error_data_portal};
                    }
		
                    if (!return_object.error) {
                        return_object = self.create_edit_node(this.tree_owner_id, this.node_id, this.data_id, this.master_parents, this.create_name, true, this.user_id, data_id_plus);
                    }
                    
                }else{	
                    grand_object = grand_object.result;
                    // PARENT
                    // find parent > search tree grand_object._id where in portal id = data_id, 
                    // and grand.data_id (tree_owner_id) is the owner of that record
                    
                    // if (tree_owner_id==portal_id)																	
                    // {
                    // 	create_name="parent_"+node_name.replace(/\s/g, "_")+data_id;	
                    // }
                    // else
                    // {
                    // 	create_name="parent_"+node_name.replace(/\s/g, "_")+portal_id;	
                    // }
                    //var parent_object = search_node_id(grand_object.data_id, create_name+grand_object.data_id);
                    
                    var creator_node_id=grand_object._id ,
                        authorizing_id=tree_owner_id, // grand_object.data_id;
                        authorized_id;
                        
                    if (this.tree_owner_id == this.portal_id) {
                        authorized_id = this.data_id;
                    } else {
                        authorized_id = this.portal_id;
                    }
                    
                    data_id_plus[this.portal_id] = [this.node_name];
                    var parent_object = self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, this.node_name, true);
                    if (this.portal_id == this.tree_owner_id && !parent_object.result){ 	// if same then can be a parent
                        parent_object=parent_object.result;	    // if no parent then add 
                         master_parents=[grand_object._id];     // before we add, do a check?
                           							            // we are adding parent to the grand parent	
                                                                // create name will be blank
                            if (this.portal_id == this.data_id || this.portal_id != grand_object.data_id){
                                return_object = error_definitions.error_data_portal;
                            } 
                            //debug=1					
                            return_object = self.create_edit_node(grand_object.data_id, this.node_id, this.data_id, this.master_parents, create_name, true, this.user_id, data_id_plus);
                            //debug=2	
                            if (debug==2) console.log(return_object);		
                    }else{	// if portal_id!=tree_owner_id find parent so we can find child
                    
                        if (parent_object.result){ 										// PARENT 
                            parent_object = parent_object.result;
                            parent_id = parent_object._id;								// set to search inside parent id
                                                                                        // see if duplicate child data_id is being added
                                                                                        // find child > search tree parent_id where in data_id = data_id, 
                                                                                        // and parent_object.data_id is the owner of that record
                            if (debug==2)   console.log(parent_object.data_id);
                            if (debug==2)   console.log(this.data_id);
                            
                            //create_name="child_"+data_id;
                            //var child_object = search_node_id(parent_object.data_id, create_name+parent_object.data_id);
                            creator_node_id = parent_object._id;
                            authorizing_id = parent_object.data_id;
                            authorized_id = data_id;
                            var child_object = self.search_node_name_data_lineage(creator_node_id, authorizing_id, authorized_id, this.node_name, false);
                            if (debug==2) console.log({child_object:child_object});
                            
                            if (child_object.result){									// CHILD existed, see if instance exists
                                child_object=child_object.result;
                                if (child_object.ancestors.indexOf(grand_object._id) < 0){ // if child existed but intance did not
                                    master_parents= self.arrayUnique(child_object.parents.concat(parent_id));
                                    
                                    if (debug==2) console.log({master_parents: master_parents});	
                                    
                                    return_object = self.create_edit_node(parent_object.data_id, child_object._id, this.data_id, this.master_parents, this.create_name, true, this.user_id, data_id_plus);	
                                    if (debug==2) console.log({return_object});	
                                }else{
                                    return_object = error_definitions.error_duplicate;	// child existed exactly then duplicate
                                }
                            }else{														// child did not exist, then add
                                master_parents = [parent_id];							// set right master parent id
                                                                                        // create name will be blank
                                if ( this.portal_id == this.data_id || this.portal_id != parent_object.data_id){
                                    return_object = error_definitions.error_data_portal;
                                } //++ above?
                                
                                return_object = self.create_edit_node(parent_object.data_id, this.node_id, this.data_id, this.master_parents, create_name, true, this.user_id ,data_id_plus);
                                if (debug==2) console.log({addchild:return_object});
                                if (debug==2) console.log({return_object});		
                            }
                        }
                    }
                }																							
            }
        }
        
        return return_object;
    },
    get_node_name_tree: function(user_id, portal_id, node_name, include_data, include_head, tree_owner_id){
        return [user_id, portal_id, node_name, include_data, include_head, tree_owner_id];
    },
    get_page: function(user_id, portal_id, page_id){
        return [user_id, portal_id, page_id];
    },
    delete_from_node_name_tree: function(user_id, portal_id, node_name, data_id, tree_owner_id, node_id){
        return [user_id, portal_id, node_name, data_id, tree_owner_id, node_id] ;
    },
    security_check: function(user_id, fn_name, portal_id){
        var return_object={};
        if (user_id==system_id){
            return_object={result:"authorized"};
        }// system id authorized to do anything
        
        if (!return_object.result) {
            return_object = this.search_security(user_id, fn_name, portal_id);
        }
        
        if (return_object.result){
            return true;
        }else{
            return false;
        }
    },
    search_node_id: function(user_id, node_id){
        var node_object = node_records[node_id];
		if (node_object){
			if ((user_id==null || user_id=="") || node_object.user_id==user_id){
				var newObject = JSON.parse(JSON.stringify(node_object));
				return {"result":newObject};
			}else{
				return error_definitions.error_not_authorized;
			}
		}else{
			return error_definitions.error_empty;
		}
    },
    search_security: function(user_id, fn_name, portal_id){
        var return_object = error_definitions.error_not_authorized;
		for (var each_record in node_records){
			if (node_records[each_record].table=="node" &&
				node_records[each_record].data_id==user_id && 
				node_records[each_record].data_id_lineage.data_id.indexOf(portal_id)>=0 &&
				(node_records[each_record].ancestors.indexOf(fn_name+system_id)>=0 || node_records[each_record].ancestors.indexOf(fn_name+portal_id)>=0)
				){
				return_object={result:"authorized"};
				break;
            }
		}
		return return_object;
    },
    arrayUnique: function (array){
        var a = array.concat();
        for(var i=0; i<a.length; ++i) {
            for(var j=i+1; j<a.length; ++j) {
                if(a[i] === a[j])
                    a.splice(j--, 1);
            }
        }
        return a;
    },
    create_edit_node: function(user_id, node_id, data_id, parents, node_name, auth_data_id, hist_user_id, data_id_plus){
        if (!data_id_plus) data_id_plus = {};
        if (!hist_user_id) hist_user_id = user_id;
        
        if (parents.length==0) parents_same=true;
        else{
            parents_same=false;
        }
        var parents_same, previous_object, node_object, return_object={}, node_sent_in=false;
        if (!auth_data_id) auth_data_id = false ;
        if (!parents) parents=[];
        if (data_id=="") data_id = null;
        if (!node_name) node_name = "";
        if (node_id=="") node_id=null;
        if (node_id) node_sent_in=true;
        if (!node_id && node_name!="") node_id = node_name.replace(/\s/g, "_")+user_id;	// generate a new id based on name...remove spaces add userid
        if (node_sent_in){
            return_object = this.search_node_id(user_id, node_id);	// see if node exists
            if (return_object.result){
                previous_object=return_object.result;	// keep a copy on how the node used to look
                node_object=JSON.parse(JSON.stringify(previous_object));
    
                if (debug==1) console.log(JSON.parse(JSON.stringify(node_object)));
    
                // check to see existing parents are exacly like incoming parents
                parents_same = (previous_object.parents.length == parents.length) && previous_object.parents.every(function(element, index) { return element === parents[index];});
                if (data_id) data_id_plus.data_id = [data_id];
                else data_id_plus.data_id = [];
                
                node_object.data_id_lineage = data_id_plus;
                node_object.data_id = data_id;													
                //if (data_id){node_object.data_id_lineage.data_id=[data_id]}else{node_object.data_id_lineage.data_id=[]}
                node_object.parents = parents;		// set node_object.parents
                node_object.ancestors = parents;	// gut ancestors, call to update_tree_lineage will replentish	
                node_object = add_date(hist_user_id,node_object);
            }																
        }
        else 																					// no node_sent in set previous object to empty
        {
            previous_object = {};
            previous_object._id=null; 
            previous_object.table="node";
            previous_object.user_id=user_id;
            previous_object.node_name=null;
            previous_object.parents=[];
            previous_object.ancestors=[];
            previous_object.data_id=null;
            previous_object.data_id_lineage={};
            previous_object.data_id_lineage.data_id=[];
            previous_object.history=[];//++
    
            node_object={};
            node_object._id=node_id; 
            node_object.table="node";
            node_object.user_id=user_id;
            node_object.node_name=node_name;
            node_object.ancestors=parents;
            node_object.data_id=data_id;
            node_object.parents=parents;
            node_object.data_id_lineage={};
            data_id_plus.data_id=[];
            //node_object.data_id_lineage.data_id=[];
            //if (data_id) {node_object.data_id_lineage.data_id=[data_id]};
            if (data_id) data_id_plus.data_id=[data_id];
            node_object.data_id_lineage=data_id_plus;
            node_object=add_date(hist_user_id, node_object);
        }
    
        if (debug==1) console.log(JSON.parse(JSON.stringify(node_object)));
        if (debug==1) console.log(data_id);
        if (!return_object.error && data_id) return_object = this.search_node_id(null, data_id); //check if data_id exists
        if (debug==1) console.log(return_object);
    
        if (!return_object.error){		
            if (!parents_same){	// if old and new parents DID change
                var external_object={};
                return_object = this.get_external_object(parents);	// get the records associated with parents
                //console.log(return_object)
                if (return_object.result) {	// now fix records ancestors and lineage
                    external_object=return_object.result;
                    if (debug==1) console.log(JSON.parse(JSON.stringify(auth_data_id)));
                    return_object = this.update_tree_lineage([node_object], external_object, "add", node_object, previous_object, auth_data_id);
                    if (debug==1) console.log(JSON.parse(JSON.stringify(return_object)));
                    if (!return_object.error) node_object=return_object.update_records[0];
                    if (debug==1) console.log(JSON.parse(JSON.stringify(node_object)));
                }
            }
            
            if (!return_object.error && node_object.node_name!=node_name)						// if it is a rename
            {
                if (debug==1) console.log(node_name);
                return_object=rename_node(user_id, node_object, node_name, previous_object);	// done -- no more processing needed
            }
            else if (node_sent_in) 																// if node sent in assume there is children to fix
            {
                return_object = process_tree(previous_object, "add", node_object);
            }
            else
            {
                return_object = save_node(node_object);											// simple save
            }
        }
        return return_object;
    },
    
    get_external_object: function(search_array){
        var temp={}, return_object={}, external_object={};
        
        return_object.result = temp;
        if (search_array==undefined) search_array=[];
        if (search_array.length!=0){
            //console.log(search_array)
            return_object = this.search_bulk(search_array);  
            //console.log(return_object)
    
            if (return_object.result && return_object.result.length!=0){
                var external_array=return_object.result;
                //console.log(external_array)
                // convert external records to {id:{},id:{},id{}} format
                for (var each_record in external_array){
                    if(external_array[each_record]){
                        external_object[external_array[each_record]._id] = external_array[each_record];
                    }
                }
                return_object={result:external_object};
            }
        }
        //console.log(return_object)
        return return_object;
    },
    search_bulk: function(read_array){
		var return_object = {   result :[]  },// error_definitions.error_empty; // theoretically impossible 
            return_array=[];
		
        for (var each_record in read_array){
            if(read_array[each_record]){
                return_array.push(JSON.parse(JSON.stringify(node_records[read_array[each_record]])));
            }
		}
        
		return_object = {"result":return_array};
		return return_object;
    },
    update_tree_lineage: function(tree_array, external_object, mode, add_object, previous_object, auth_data_id){
        var history_object= add_object.history[add_object.history.length -1],						// get last element of the array
            update_records=[], delete_records=[], return_object={}, node_object={},
            exclude_ancestors = previous_object.ancestors.filter(x => add_object.ancestors.indexOf(x) < 0),
            include_ancestors = add_object.ancestors.filter(x => exclude_ancestors.indexOf(x) < 0),
            exclude_lineage = subtract_lineage(previous_object.data_id_lineage, add_object.data_id_lineage),
            //previous_object.data_id_lineage.filter(x => add_object.data_id_lineage.indexOf(x) < 0)
            include_lineage = subtract_lineage(add_object.data_id_lineage, exclude_lineage),
            //add_object.data_id_lineage.filter(x => exclude_lineage.indexOf(x) < 0)
            external_ancestors={},//[];
            external_lineage = {};//[];
            
        // see diff between add_object vs previous_object 
        // exclude = previous - current, remove from future result then add external  
        // include = current - previous, add to future result
    
        // in the case of a rename, add new to include, remove old from exclude
        if (add_object._id != previous_object._id) {
            if (add_object._id && include_ancestors.indexOf(add_object._id)<0) { include_ancestors.push(add_object._id); }
            if (previous_object._id && exclude_ancestors.indexOf(previous_object._id)<0) { exclude_ancestors.push(previous_object._id); }
        }
    
        //if (previous_object.history.length>1){console.log({previous_object:previous_object})}
        if (debug==1) console.log({"add_object": add_object});
        if (debug==1) console.log({previous_object:JSON.parse(JSON.stringify(previous_object))});
        if (debug==1) console.log({exclude_ancestors: exclude_ancestors});
        if (debug==1) console.log({include_ancestors:include_ancestors});
        if (debug==1) console.log({exclude_lineage: exclude_lineage});
        if (debug==1) console.log({include_lineage:include_lineage});
        if (debug==1) console.log({external_array:external_object});
    
        for (var each_record in tree_array)	{
            node_object =   tree_array[each_record];
            
            if (mode=="del"){
                // if external ancestors 1,2,3,4,5 and node parents 1,6 for del we want final node parents to be 1
                // i.e. find intersection of arrays external_ancestors to node_object.parents
                var j=0, c=[];
                for (var i=0; i < node_object.parents.length; ++i){
                    if ( node_object.ancestors.indexOf(node_object.parents[i]) != -1 ) c[j++] = node_object.parents[i];
                }
                node_object.parents = c;
            }
    
            // get external lineage for node_object
            return_object = this.generate_external_lineage(node_object, external_object, auth_data_id);	// generate external lineage of record based on its parents
            if (return_object.error)
            {
                break;
            }else{
                external_lineage = return_object.result.external_lineage;
                external_ancestors=return_object.result.external_ancestors;
    
                // ancestors = (record ancestors + overall include - overall exclude) + record ancestors
                node_object.ancestors = this.arrayUnique( node_object.ancestors.concat(include_ancestors).filter(function(x){ return exclude_ancestors.indexOf(x)< 0;}).concat(external_ancestors));
    
                var all=[node_object.data_id_lineage, include_lineage, exclude_lineage, external_lineage];
                var unique = this.arrayUnique(new Array([].concat.apply([],all.map(Object.keys)))[0]);
    
                if (debug==1) console.log({all:all});
                if (debug==1) console.log({unique:unique});
                for (var item in unique){
                    if(unique[item]){
                        var key=unique[item];
                        if (debug==1) console.log(key);
                        if (debug==1) console.log(node_object.data_id_lineage[key]);
                        if (debug==1) console.log(include_lineage[key]);
                        if (debug==1) console.log(exclude_lineage[key]);
                        if (debug==1) console.log(external_lineage[key]);
                        
                        if (!node_object.data_id_lineage.hasOwnProperty(key)) node_object.data_id_lineage[key] = [];
                        if (!include_lineage.hasOwnProperty(key)) include_lineage[key] = [];
                        if (!exclude_lineage.hasOwnProperty(key)) exclude_lineage[key] = [];
                        if (!external_lineage.hasOwnProperty(key)) external_lineage[key] = [];
                        
                        node_object.data_id_lineage[key] = this.arrayUnique( node_object.data_id_lineage[key].concat(include_lineage[key]).filter(function(x){ return exclude_lineage[key].indexOf(x)<0; }).concat(external_lineage[key]));
                    }
                    
                }
    
                if (debug==1) console.log({node_object:node_object})
                // if current record's parent refers to record being renamed then deal with, we do this AFTER external call
                if (add_object._id != previous_object._id) 
                {
                    var index = node_object.parents.indexOf(previous_object._id)
                    if (index > -1) 
                    {
                        node_object.parents.splice(index, 1);
                        if (add_object._id && node_object.parents.indexOf(add_object._id) < 0) {node_object.parents.push(add_object._id)};	
                    }
                }
    
                // this should apply only to add object and to undo if (add_object._id != previous_object._id) 2nd above
                var index = node_object.ancestors.indexOf(node_object._id)
                if (index > -1) {node_object.ancestors.splice(index, 1)};
    
                //if (node_object._id == add_object._id) {console.log({HEREHERERERERERER:node_object})};
                //if (!history_object) {console.log("*********************** ERROR"); console.log(JSON.parse(JSON.stringify(node_object)))};
    
                if (history_object && node_object._id != add_object._id) {node_object.history.push(history_object)};
    
                if (mode=="del")											// if parents length = 0 and delete then add to delete 
                { 
                    var empty=true;
                    for (var key in external_lineage)
                    {
                        if (external_lineage.hasOwnProperty(key))
                        {
                            if (external_lineage[key].length!=0){empty=false; break};									
                        }
                    }
                    if (empty){delete_records.push(node_object)}else{update_records.push(node_object)}
                }
                else
                {
                    update_records.push(node_object);
                }
            }
        }
    
        if (!return_object.error) {return_object={delete_records:delete_records, update_records:update_records};};
        return return_object;
    },
    generate_external_lineage: function(record, external_object, auth_data_id){
        var return_object={}, parents_ancestors=[], parents_lineage ={},//;
            external_ancestors=[], external_lineage={},//[];
            ancestors = record.ancestors, parent_id, parent_user_id;
    
        // generate external lineage based on ancestors, risk with parents is that immeidate parent is local, but all inside of parent is external
        for (var each_parent in ancestors){
            
            if (external_object[ancestors[each_parent]]){
                
                if (debug==1){
                    console.log({external_object:external_object[ancestors[each_parent]]});
                }
                // now add each of the parents ancestors and data lineage to arrays 
                parent_id= external_object[ancestors[each_parent]]._id;// return_object._id;
                parent_user_id = external_object[ancestors[each_parent]].user_id;
                parents_ancestors = external_object[ancestors[each_parent]].ancestors;// return_object.ancestors;
                parents_lineage = external_object[ancestors[each_parent]].data_id_lineage;// return_object.data_id_lineage;
    
    
                if (parent_id) parents_ancestors.push(parent_id);
    
                if (auth_data_id && record.user_id!=parent_user_id && parents_lineage.data_id.indexOf(record.user_id)<0){
                    if (debug==1) console.log({not:external_object[ancestors[each_parent]]});
                    // security check, is my user_id mentioned in data_id (lineage?) or am I owner of parent also
                    return_object={error:error_definitions.error_not_authorized};
                    break;
                }
    
                for (var each_record in parents_ancestors){
                    if(parents_ancestors[each_record]){
                        if (external_ancestors.indexOf(parents_ancestors[each_record])<0){
                            external_ancestors.push(parents_ancestors[each_record]);
                        }
                    }
                }
    
                for (var key in parents_lineage){										// {data_id:[item1, item2], key: [item3, item4]}
                    if (parents_lineage.hasOwnProperty(key)){	
                        var data_lineage=parents_lineage[key];							//[item3, item4] array
                        for (var item in data_lineage){
                            if(data_lineage[item]){
                                if (!external_lineage[key]) external_lineage[key] = [];		// create data_id,
                                if (external_lineage[key].indexOf(data_lineage[item])<0) external_lineage[key].push(data_lineage[item]);	// check for item in data_id, key
                            }
                        }
                    }
                }
            }	
        } // for each ancestor
    
        if (!return_object.error){
            return_object = {};
            return_object.result={};
            return_object.result.external_ancestors=external_ancestors;
            return_object.result.external_lineage=external_lineage;
        }
        
        if (debug==1){  console.log({END_END: record._id, return: return_object.result}); }
        return return_object;
    }


};