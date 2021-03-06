(function(){
	Dialog = function (cfg){
		this.cfg = cfg || {};
		
		if (this.cfg.dockable)
			this.htmlDialog = createDockable(this.cfg.dockable);
		else
			this.htmlDialog = createDialog(this.cfg);
			
		try{
			var d = this.htmlDialog.document;
			d.write("<html><head></head><body></body></html>");
			d.close();

			// provide Dialog reference to IE 
			d.Dialog = this;

			var styles = d.createElement('style');
			styles.setAttribute('type', 'text/css');
			styles.styleSheet.cssText = this.cfg.css || '\nbody {overflow: auto;}\n';

			var headRef = d.getElementsByTagName('head')[0];
			headRef.appendChild(styles); 
			
			d.body.innerHTML = this.cfg.html || "";
			
			for(var el in this.cfg){
				if (!/^(css|html|oncreate)$/i.test(el) && this.htmlDialog[el]!=undefined){
					this.htmlDialog[el] = this.cfg[el];
				}
			}
			
		}catch(e){
			debug(e);
		}

		if (typeof(this.cfg.oncreate)=="function")
			this.cfg.oncreate.call(this.htmlDialog.document);
		
	};

	Dialog.prototype.show = function(){
		this.htmlDialog.visible = true;	
	}
	Dialog.prototype.hide = function(){
		this.htmlDialog.visible = false;	
	}
	Dialog.prototype.close = function(){
		this.htmlDialog.close();	
	}
	
	Dialog.prompt = function(title, value, func){
		new Dialog({
			npp: Editor,
			html: "<input type='text' id='prompt_str' style='width:100%' onkeypress='Dialog.cfg.onKeyDown(window.event, Dialog);' />", 
			height: 100,
			width: 300,
			title: title,
			css: "body{background-color: buttonface; overflow:auto;}",
			oncreate: function(){
				var el = this.getElementById("prompt_str");
				el.value = value;
				el.focus();
			},
			onKeyDown: function(evt, dialog) {
				var target = evt.srcElement || evt.target,
					keycode = evt.keyCode || evt.which;
					
				if (keycode == 27 || keycode == 13) { 
					// escape or enter key pressed
					var value = null;
					if (keycode == 13)
						value = target.value;
						
					try{
						switch(typeof(func)){
						case "object": 
							if (func.cmd(value) == false) return;
							break;
						case "function":
							if (func(value) == false) return;
							break;
						}
					}catch(e){}
					
					dialog.hide();
				}
			}
		});
	};

	Dialog.Grid = function(cfg){
		this.initialCfg = cfg;
		this.css =  "body{              "+
					"	overflow:auto;  "+
					"	padding:0;      "+
					"	margin:0        "+
					"}                  "+
					"#cont{"+
					"	margin-top: expression(eval(document.getElementById('head').scrollHeight));"+
					"}                            "+
					".mover{                      "+
					"	background-color:#eee;    "+
					"}                            "+
					"table{                       "+
					"	font-size:12px;           "+
					"	border-collapse:collapse; "+
					"	width: 100%;              "+
					"}                            "+
					"td{                          "+
					"	border: 1px solid #d8d8d8;"+
					"	cursor: pointer;          "+
					"	padding: 2px 10px;        "+
					"}                            "+
					"#head{             "+
					"	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#ffffff', endColorstr='#d8d8d8');"+
					"	position: absolute; "+
					"	top: expression(eval(document.body.scrollTop))"+
					"}"+
					"#head td{                                  "+
					"	border-color: #fff #d8d8d8 #aaa #d8d8d8;"+
					"	padding:3px 0;                          "+
					"	text-align: center;                     "+
					"	vertical-align: middle;                 "+
					"}                                          ";
					"#head td div{                                          ";
					"	overflow: hiden;                        "+
					"}                                          ";

		this.html = "<table id='cont'></table><table id='head'></table>";
		
		function window(el){
			return el.ownerDocument.parentWindow;
		}

		function target(el){
			var evt = window(el).event;
			var result = evt.srcElement || evt.target;
			return result;
		}
		
		function parent(el,name){
			if (el.tagName == name)
				return el;
			return parent(el.parentNode, name);
		}
		
		function onMOver(){
			var row = parent(target(this), "TR");
			row.className = "mover";

		}
		function onMOut(){
			var row = parent(target(this), "TR");
			row.className = "";
		}
		
		function Empty(){}
		
		function onclickTmpl(fnName){
			if (typeof(cfg[fnName])!="function")
				return Empty;
			
			function onClick(){				
				var cell = parent(target(this), "TD");
				
				cfg[fnName](cell, target(this));
			}
			return onClick;
		}
		
		function resizeHead(){
			// adjust width of header cell to the width of content cell
			this.ownerDocument.getElementById("head").rows[0].cells[this.cellIndex].style.width = this.clientWidth+"px"; 
		}

		this.oncreate = function(){
			var headEl = this.getElementById("head");
			var contEl = this.getElementById("cont");
			//window = this.parentWindow;
			
			headEl.onmouseover = onMOver;
			headEl.onmouseout  = onMOut;
			headEl.onclick     = onclickTmpl("onHeaderClick");
			
			contEl.onmouseover = onMOver;
			contEl.onmouseout  = onMOut;
			contEl.onclick     = onclickTmpl("onRowClick");
			
			contEl.onresize = function(){
				// adjust width of head to the width of content table
				this.ownerDocument.getElementById("head").style.width = this.clientWidth + "px";
			};
			
			if (!cfg.header)
				throw "Expect header array";
			
			var headerRow = headEl.insertRow();
			for(var i=0; i<cfg.header.length; i++){
				headerRow.insertCell().innerHTML = "<div>" + cfg.header[i].toString() +"</div>";
			}
			
			
			for(var i=0; i<cfg.rows.length; i++){
				var contRow = contEl.insertRow();
				var row = cfg.rows[i];
				for(var c=0; c<row.length; c++){
					var cell = contRow.insertCell();
					cell.innerHTML = row[c].toString();
					if(i > 0)
						continue;
						
					// add resize handler to cells of first content row
					cell.onresize = resizeHead;
				}
			}
		}	
	
		jN.copyTo(this, cfg);
		
		if (cfg.css)
			this.css += cfg.css;
	}
	
})();

//own grid-view dialog
createGridViewDialog = function createGridViewDialog(cfg) {
	var header = "";
	for (var i = 0; i < cfg.header.length; i++)
		header += "<th>" + cfg.header[i] + "</th>";
	
	new Dialog({
		npp : Editor,
		html : "<table id='results' onMouseOver='Dialog.cfg.onMOver(window.event);' onMouseOut='Dialog.cfg.onMOut(window.event);' onclick='Dialog.cfg.onClick(window.event, Dialog);' onkeypress='Dialog.cfg.onKeyDown(window.event, Dialog);'><tr>" + header + "</tr></table>",
		height : cfg.height || 500,
		width : cfg.width || 800,
		top : cfg.top || 200,
		title : cfg.title,
		css : (cfg.css ? cfg.css + "\n" : "") + "body{overflow:auto;} .highlight{background-color:#eee;} #results{ font-size:12px; border-collapse:collapse} td{cursor:pointer;} td,th{border: 1px solid #d8d8d8; padding: 2px 10px} th{ background-color: #d8d8d8; padding-top:5px; text-align: center; vertical-align: middle;} " +
		"i.warning{ background-position:-16px 0;} i.fatal_error{ background-position:-32px 0;} i.notice{ background-position:-48px 0;}" +
		"i.notice,i.fatal_error,i.warning,i.error{width:16px; height:16px; background-repeat: no-repeat; background-image: URL(data:image/png;base64,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)}",
		
		oncreate : function () {
			var el = this.getElementById("results");
			
			var log = "";
			for (i = 0, len = cfg.arr.length; i < len; i++) {
				var row = el.insertRow();
				this.Dialog.cfg.cell(row, cfg.getCells(cfg.arr[i]));
			}
			el.focus();
		},
		cell : function (r, arr) {
			for (var i = 0, c = arr.length; i < c; i++)
				r.insertCell().innerHTML = arr[i];
		},
		parent : function (el, name) {
			if (el.tagName == name)
				return el;
			return this.parent(el.parentNode, name);
		},
		onMOver : function (evt) {
			var target = evt.srcElement || evt.target;
			var row = this.parent(target, "TR");
			row.className = "highlight";
		},
		onMOut : function (evt) {
			var target = evt.srcElement || evt.target;
			var row = this.parent(target, "TR");
			row.className = "";
		},
		onClick : function (evt, d) {
			if (typeof(cfg.onRowClick) != "function")
				return;
			
			var target = evt.srcElement || evt.target;
			var row = this.parent(target, "TR");
			
			cfg.onRowClick(row, target);
		},
		onKeyDown : function (evt, dialog) {
			var target = evt.srcElement || evt.target,
			keycode = evt.keyCode || evt.which;
			
			if (keycode == 27 || keycode == 13) {
				dialog.hide();
			}
		}
	});
}
/*
new Dialog({
	onbeforeclose : function () {
		alert('bc');
		return false;
	},
	onclose : function () {
		alert('aa')
	},
	oncreate : function () {
		this.getElementById('prompt_str').focus();
	},
	css : "body{background-color: buttonface; overflow:auto;}",
	html : "<input type='text' id='prompt_str' style='width:100%' onkeypress='Dialog.close()' /><br/><a href='http://www.softwarecanoe.de' target='_blank'>www.softwarecanoe.de</a>"
});*/

/**
Example 1 Create dialog with grid
 
var dialCfg = new Dialog.Grid({
	header:["-","Line","Column","Title"],
	rows:[
		["<i class='warning'/>","l","c","t"],["<i class='error'/>","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"],["","l","c","t"]
	],
	onHeaderClick:function(cell, target){
		alert("h: "+this.header[cell.cellIndex]);
	},
	onRowClick:function(cell, target){
		alert("r: "+this.rows[cell.parentNode.rowIndex][cell.cellIndex]);
	},
	title:"Copied Title",
	clientHeight: 200,
	clientWidth: 200,
	css:"i.warning{ background-position:-16px 0;} i.warning,i.error{width:16px; height:16px; background-repeat: no-repeat; background-image: URL(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAQCAYAAAB3AH1ZAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAABOtJREFUSMe1lFtsVGUQx3/zfefs2XN2l25b1ra0dqEtLQ1CUVJRlAApjddQjGg0Jj6oiQmXqEFj4oPigxGiRAM8eHsxUSNCYor64IUYIyFAQwoFbexFKKYV2tKL2+6lu3s+HxbxQtEn53Fm/jO/b+bLwL/YJ044/pHtVPE/mlwr8Dro+1fefM7PpDIHTpyufx78/yp24t5gDFgPrAOagTgwAHQA3wAHl3+eHvmrxrpWsbk6/Mj87fOqSE9RdV/PA+Qz+/6teWdbsAXYGqlf2hZetpZgfCk6Wk5u4kLtzEBXbeLktw8lerraO9uCe25sTx/6Q6dnK7YTAq3LV3xXOm88gCSInpvTWvHr6K6vrzGFUxudFivk7Sq5adXqktZHcePL0G4IwaCDIQJlNbjxhWg/tSg7ebHpyXrT+9aP+bMAaraC86zYc7VPl4dH3+jAf/UU128vKqrU3ubZck8/7MSUzdY5DUuawstbEMsif6kHbQve4la0LeQu9SCWRXh5C3MaljQpm62nH3ZiswLsAG/FyqUvpt8+gNq8n8Rjn8KBo6y7uWrHDiT4z3wrYNaH43VtXvVCSA7jDx7GjB5DsmOFT5Ydg9Fj+IOHITmMV72QcLyuzQqY9bMCxJ2yN2uf8QJDJwwlz26k6NkNZD6D617KO9W298rVAKxzyioxk71IegiVHcBiBDNxqpCQ7MdiBJUdQNJDmMlenLJKrADrrgLYiRTf3rroCX9fB8b86R/LAC/0c1eDfupVpOivGu2YZjvkItP9qKkuLBlG62FU5ofCBNLdaD2MJcOoqS5kuh875KId03wVwEJ33sdV66flYl+aSKDgM0A6CeYCRNckdV3AfvdvE3BMXHsu2rPR/lmUdQllj0HuNGQnIXcGZY+hrHG0f7aQ57lYjon/DWAXUr/2jopW/6t+ihsjxGb+PBQxBThAV457brA3bofqKwBBBkTl0SEbFbFQ9hgS/A1xJ8kdr0Ws80jwN5Q9iopY6JCNqDxWkIErAK+BLCmK7Ys+lpLshI935BcsC0aiwkhUCJeBeMAQuK0z0mSpD66sIGA6MCl0eSNSMh+8HLgppPIurNtGUTWbwE2Bl0NK5qPLG8GkCro/ACJirV3zYOky83I3TuckRIAiiE4YiicM2BR8Cjie4+4bA6t2IrdeXsE3pM6jShuQaD0SroCQBufycAMCIY2EK5BoPaq0AVLnCzrA2g32koj1od3ZDeeABUCxC6kUdk8fRD2YAxRHIDMNQ4ZA6wzLuuT9lzNmkeVwkMSZdn+kqk3V34IJXIfY4xg6yQ2WAWVQugGTLYaZGH7PUVTiTLtyOAgg+7V6fEOl/55lA3OBuIYFHtTVwGBf4RUNi6H3HPSNQ28WbMjnhHeO6Ec2kftoeq+04BTtUjW3N+m6lYinwVagBfIGsj4mmSffdwT/58OnyExuC20xhwCsklBRLLttbzY9lUcXBxA7KBJ1DI4rUhMCX5ncVFKkIYGpSBvTnDL+eB4Z+8lUnthdQyZBaIs5lHpnchv9X2z1U7+0SWUjEosjXjEmOY4ZGcAMdsNQV7uCPe7l5gDysWK1Rh4QY5IWIhpjlEjhDogRDL4PykfMDJgcyEwh6iYNX2yCL4EgULJ6AXXP3MOdi6tpnhuh0Q1QnprhwmiC7h/O07F9P9+fvMgAMAxMALnfARodxAmP18qUAAAAAElFTkSuQmCC)}"

});

var d = new Dialog(dialCfg);

Example 2 Dockable dialog with grid

dialCfg.dockable = {name:"MyDock", docking:"bottom"};
var d = new Dialog(dialCfg);

Example 3 Shows working with onbeforeclose and onclose events

new Dialog({onbeforeclose:function(){ alert('bc'); return false;}, onclose:function(){alert('aa')}, oncreate: function(){ this.getElementById('prompt_str').focus();} ,css: "body{background-color: buttonface; overflow:auto;}", html:"<input type='text' id='prompt_str' style='width:100%' onkeypress='Dialog.close()' /><br/><a href='http://www.softwarecanoe.de' target='_blank'>www.softwarecanoe.de</a>"});


*/

