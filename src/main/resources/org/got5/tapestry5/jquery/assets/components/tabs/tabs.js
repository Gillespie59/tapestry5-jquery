(function( $ ) {
	$.extend(Tapestry.Initializer, {
	    tabs: function(specs) {
			var p = specs.params;
			console.log(p);
			if(!p.ajaxOptions)
				p.ajaxOptions={};
			if(!p.ajaxOptions.beforeSend)
				$.extend(p.ajaxOptions, {beforeSend:function(){
					//returning false in beforeSend function cancels the AJAX request, see issue #52
					return false;
				}});
			$("#" + specs.id).tabs(p);
	    }
	});
}) ( jQuery );