module.exports = function(RED) {
	function treeView(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.on('input', function(msg) {
            var payload = msg.payload;
            msg.payload = " Tree view node output :- " + payload ;
			node.send(msg);
		});
	}
	RED.nodes.registerType("Tree View", treeView);
};