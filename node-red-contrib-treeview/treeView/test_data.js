var
	system_id = "f1b5ed9577f69c6b131d94a46b39044f", //"system_id"; // user
	company_id = "8e3384889429685de23b3b4226f13685", // user
	user_id_co = "da9976858d8bda52021754cf1909a327", // user
	user_id_employee = "0a9b50963bc76018418ffd857d551ced", // user
	group_name_page = "2_0", //task
	item1 = "2_3", //item1"; // detail associated with task above
	item2 = "c01a40e0a39ab7071c72d422a5c96104"; // detail associated with task above

module.exports = {
    node_original1: {
		system_id: {
			"_id": system_id,
			"table": "users",
			"user_id": system_id
		},
		company_id: {
			"_id": company_id,
			"table": "users",
			"user_id": company_id
		},
		user_id_co: {
			"_id": user_id_co,
			"table": "users",
			"user_id": user_id_co
		},
		user_id_employee: {
			"_id": user_id_employee,
			"table": "users",
			"user_id": user_id_employee
		},
		group_name_page: {
			"_id": group_name_page,
			"table": "task",
			"user_id": company_id
		},
		item1: {
			"_id": item1,
			"table": "detail",
			"user_id": company_id
		},
		item2: {
			"_id": item2,
			"table": "detail",
			"user_id": company_id
		}
	},
    node_original2: {
		"987": {
			"_id": "987",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "xxx",
			"data_id": "999",
			"data_id_lineage": {
				"data_id": ["999"]
			},
			"parents": [],
			"ancestors": []
		},
		"testname111": {
			"_id": "testname111",
			"table": "node",
			"node_name": "testname",
			"history": [],
			"user_id": "111",
			"data_id": "",
			"data_id_lineage": {
				"data_id": ["999"]
			},
			"parents": ["987"],
			"ancestors": ["987"]
		},
		"444": {
			"_id": "444",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "testname111",
			"data_id": "",
			"data_id_lineage": {
				"data_id": ["999"]
			},
			"parents": ["987"],
			"ancestors": ["987"]
		},
		"666": {
			"_id": "666",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "333",
			"data_id": "",
			"data_id_lineage": {
				"data_id": ["999"]
			},
			"parents": ["987"],
			"ancestors": ["987"]
		},
		"1001": {
			"_id": "1001",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "111",
			"data_id": "AAA",
			"data_id_lineage": {
				"data_id": ["AAA", "999"]
			},
			"parents": ["testname111"],
			"ancestors": ["987", "testname111"]
		},
		"1002": {
			"_id": "1002",
			"table": "node",
			"history": [],
			"node_name": "",
			"user_id": "111",
			"data_id": "BBB",
			"data_id_lineage": {
				"data_id": ["BBB", "999"]
			},
			"parents": ["testname111"],
			"ancestors": ["987", "testname111"]
		},
		"1003": {
			"_id": "1003",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "testname111",
			"data_id": "CCC",
			"data_id_lineage": {
				"data_id": ["CCC", "999"]
			},
			"parents": ["444"],
			"ancestors": ["987", "444"]
		},
		"1004": {
			"_id": "1004",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "333",
			"data_id": "DDD",
			"data_id_lineage": {
				"data_id": ["DDD", "999"]
			},
			"parents": ["666"],
			"ancestors": ["987", "666"]
		},
		"999": {
			"_id": "999",
			"table": "node",
			"node_name": "assistants",
			"history": [],
			"user_id": "xxx",
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"AAA": {
			"_id": "AAA",
			"table": "node",
			"node_name": "assistants",
			"history": [],
			"user_id": "111",
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"BBB": {
			"_id": "BBB",
			"table": "node",
			"node_name": "assistants",
			"history": [],
			"user_id": "111",
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"CCC": {
			"_id": "CCC",
			"table": "node",
			"node_name": "assistants",
			"history": [],
			"user_id": "testname111",
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"DDD": {
			"_id": "DDD",
			"table": "node",
			"node_name": "assistants",
			"history": [],
			"user_id": "333",
			"data_id": "111",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"testfnsystem_id": {
			"_id": "testfn" + system_id,
			"table": "node",
			"node_name": "testfn",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"get_node_name_treesystem_id": {
			"_id": "get_node_name_tree" + system_id,
			"table": "node",
			"node_name": "get node name tree",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"add_to_node_name_treesystem_id": {
			"_id": "add_to_node_name_tree" + system_id,
			"table": "node",
			"node_name": "add to node name tree",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"delete_from_node_name_treesystem_id": {
			"_id": "delete_from_node_name_tree" + system_id,
			"table": "node",
			"node_name": "delete from node name tree",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"delete_node_name_instancesystem_id": {
			"_id": "delete_node_name_instance" + system_id,
			"table": "node",
			"node_name": "delete node name instance",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"create_node_name_instancesystem_id": {
			"_id": "create_node_name_instance" + system_id,
			"table": "node",
			"node_name": "create node name instance",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"companiessystem_id": {
			"_id": "companies" + system_id,
			"table": "node",
			"node_name": "companies",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id],
			"ancestors": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id]
		},
		"reminderbot_company_auth_id": {
			"_id": "reminderbot_company_auth_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "reminderbot_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id"]
			},
			"parents": ["companies" + system_id],
			"ancestors": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id, "companies" + system_id]
		},
		"company_reminder_user123_id": {
			"_id": "company_reminder_user123_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "reminderbot_id",
			"data_id": "user123_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id", "user123_id"]
			},
			"parents": ["reminderbot_company_auth_id"],
			"ancestors": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id, "companies" + system_id, "reminderbot_company_auth_id"]
		},
		"employee_actionssystem_id": {
			"_id": "employee_actions" + system_id,
			"table": "node",
			"node_name": "employee actions",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": ["add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id],
			"ancestors": ["add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id]
		},
		"employeesystem_id": {
			"_id": "employee" + system_id,
			"table": "node",
			"node_name": "employees",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": ["employee_actions" + system_id],
			"ancestors": ["add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "employee_actions" + system_id]
		},
		"reminderbot_employee_auth_id": {
			"_id": "reminderbot_employee_auth_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "reminderbot_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id"]
			},
			"parents": ["employee" + system_id],
			"ancestors": ["add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "employee_actions" + system_id, "employee" + system_id]
		},
		"reminderbot_employees_id": {
			"_id": "reminderbot_employees_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "reminderbot_id",
			"data_id": "user123_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id", "user123_id"]
			},
			"parents": ["reminderbot_employee_auth_id"],
			"ancestors": ["get_node_name_tree" + system_id, "add_to_node_name_tree" + system_id, "employee_actions" + system_id, "employee" + system_id, "reminderbot_employee_auth_id"]
		},
		"employee222_perm_id": {
			"_id": "employee222_perm_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "reminderbot_id",
			"data_id": "employee222_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id", "user123_id", "employee222_id"]
			},
			"parents": ["company_reminder_user123_id"],
			"ancestors": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id, "companies" + system_id, "reminderbot_company_auth_id", "company_reminder_user123_id"]
		},
		"employee333_perm_id": {
			"_id": "employee333_perm_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "reminderbot_id",
			"data_id": "employee333_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id", "user123_id", "employee333_id"]
			},
			"parents": ["company_reminder_user123_id"],
			"ancestors": ["testfn" + system_id, "create_node_name_instance" + system_id, "delete_node_name_instance" + system_id, "add_to_node_name_tree" + system_id, "get_node_name_tree" + system_id, "delete_from_node_name_tree" + system_id, "companies" + system_id, "reminderbot_company_auth_id", "company_reminder_user123_id"]
		},
		"sub_employee333_perm_id": {
			"_id": "sub_employee333_perm_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": "reminderbot_id",
			"data_id": "employee444_id",
			"data_id_lineage": {
				"data_id": [system_id, "reminderbot_id", "user123_id", "employee333_id", "employee444_id"]
			},
			"parents": ["employee333_perm_id"],
			"ancestors": ["get_node_name_tree" + system_id, "add_to_node_name_tree" + system_id, "employee_actions" + system_id, "employee" + system_id, "reminderbot_employee_auth_id", "reminderbot_employees_id", "employee333_perm_id", "delete_from_node_name_tree" + system_id]
		},
		"employee333_id": {
			"_id": "employee333_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"employee222_id": {
			"_id": "employee222_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"employee444_id": {
			"_id": "employee444_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"employee555_id": {
			"_id": "employee555_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "employee444_id",
			"data_id_lineage": {
				"data_id": ["employee444_id", system_id]
			},
			"parents": ["user123_id"],
			"ancestors": ["user123_id"]
		},
		"user123_id": {
			"_id": "user123_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": system_id,
			"data_id_lineage": {
				"data_id": [system_id]
			},
			"parents": [],
			"ancestors": []
		},
		"reminderbot_id": {
			"_id": "reminderbot_id",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "",
			"data_id_lineage": {
				"data_id": []
			},
			"parents": [],
			"ancestors": []
		},
		"oldsystem_id": {
			"_id": "old" + system_id,
			"table": "node",
			"node_name": "old",
			"history": [],
			"user_id": system_id,
			"data_id": "employee333_id",
			"data_id_lineage": {
				"data_id": ["employee333_id"]
			},
			"parents": [],
			"ancestors": []
		},
		"oldsystem_id_child": {
			"_id": "oldsystem_id_child",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "employee222_id",
			"data_id_lineage": {
				"data_id": ["employee333_id", "employee222_id", "employee444_id", system_id]
			},
			"parents": ["old" + system_id, "employee555_id"],
			"ancestors": ["old" + system_id, "employee555_id", "user123_id"]
		},
		"oldsystem_id_childchild": {
			"_id": "oldsystem_id_childchild",
			"table": "node",
			"node_name": "",
			"history": [],
			"user_id": system_id,
			"data_id": "employee444_id",
			"data_id_lineage": {
				"data_id": ["employee333_id", "employee222_id", "employee444_id", system_id]
			},
			"parents": ["oldsystem_id_child"],
			"ancestors": ["old" + system_id, "oldsystem_id_child", "employee555_id", "user123_id"]
		}
    }
};