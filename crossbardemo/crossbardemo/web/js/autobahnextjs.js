Ext.define("AB.data.Store",{override:"Ext.data.Store",autoSync:false,constructor:function(){var a=this;a.callParent(arguments);if(!a.model){return true}a.addEvents("afterWampWrite");a.model.getProxy().on("oncreate",function(g,h){console.log("got oncreate event ",a.model.prototype.idProperty,h,h[a.model.prototype.idProperty]);var c=a.getById(h[a.model.prototype.idProperty]);if(c){var b=a.model.prototype.fields.items;for(var f=0;f<b.length;++f){if(h[b[f].name]!==undefined){c.set(b[f].name,h[b[f].name])}}c.dirty=false}else{var d=[new a.model(h)],e={addRecords:true,start:0};a.loadRecords(d,e)}if(!(a.remoteSort||a.buffered)){a.sort()}a.fireEvent("afterWampWrite",a,h)});a.model.proxy.on("onupdate",function(e,f){var c=a.getById(f[a.model.prototype.idProperty]);console.log("wamp update ",a.model.prototype.idProperty,c);if(c){var b=a.model.prototype.fields.items;for(var d=0;d<b.length;++d){if(f[b[d].name]!==undefined){c.set(b[d].name,f[b[d].name])}}c.dirty=false;if(!(a.remoteSort||a.buffered)){a.sort()}a.fireEvent("afterWampWrite",a,f)}});a.model.proxy.on("ondestroy",function(c,d){var b=a.getById(d[a.model.prototype.idProperty]);if(b){a.remove(b)}a.fireEvent("afterWampWrite",a,d)})}});Ext.define("AB.data.TreeStore",{override:"Ext.data.TreeStore",autoSync:false,constructor:function(){var a=this;a.callParent(arguments);if(!a.model){return true}a.addEvents("afterWampWrite");a.model.getProxy().on("oncreate",function(b,e){if(e.father_node==""){a.getRootNode().insertChild(0,e)}else{var c=a.model.prototype.nodeParam||"node";console.log("insert in tree node ",c,e.father_node);var d=a.getRootNode().findChild(c,e.father_node);if(d&&d.isLoaded()){d.insertChild(0,e)}else{}}if(!(a.remoteSort||a.buffered)){a.sort()}a.fireEvent("afterWampWrite",a,e)});a.model.proxy.on("onupdate",function(b,e){var d=a.getRootNode().findChild(a.model.prototype.idProperty,e[a.model.prototype.idProperty],true);if(d){d.remove()}if(e.father_node===""){a.getRootNode().insertChild(0,e)}else{var c=a.model.prototype.nodeParam||"node";a.getRootNode().findChild(c,e.father_node).insertChild(0,e)}if(!(a.remoteSort||a.buffered)){a.sort()}a.fireEvent("afterWampWrite",a,e)});a.model.proxy.on("ondestroy",function(b,d){var c=a.getRootNode().findChild(a.model.prototype.idProperty,d[a.model.prototype.idProperty],true);if(c){c.remove()}a.fireEvent("afterWampWrite",a,d)})}});Ext.define("AB.app.WampApplication",{extend:Ext.app.Application,cookieDomain:null,websocketURI:null,appKey:null,appSecret:null,maxRetries:10,retryDelay:300,topicToPrefix:null,topicPrefix:null,onWebmqReady:function(){this.resumeLaunch()},permissions:null,absession:null,resumeLaunch:function(){var a=this;if(!this.isLaunched){AB.app.WampApplication.superclass.constructor.apply(a,arguments)}this.isLaunched=true},constructor:function(b){var c=this;console.log("Starting WampApplication",c.websocketURI,cookieDomain);var a=null;if(document.cookie!=""){a={cookies:{}};a.cookies[c.cookieDomain]=document.cookie}ab.connect(c.websocketURI,function(d){c.absession=d;absession=d;console.log("WebMQ connected!",absession);c.absession.authreq(c.appKey,a).then(function(f){var e=c.absession.authsign(f,c.appSecret);c.absession.auth(e).then(function(g){c.permissions=g;if(c.topicToPrefix!=null&&c.topicPrefix!=null){c.absession.prefix(c.topicPrefix,c.topicToPrefix)}c.onWebmqReady()},ab.log)},ab.log)},function(e,f,d){console.log("WebMQ connection failed!",e,f,d);c.absession=null;switch(e){case ab.CONNECTION_UNSUPPORTED:window.location="http://absession.ws/unsupportedbrowser";break;case ab.CONNECTION_CLOSED:window.location.reload();break;default:console.log(e,f,d);break}},{maxRetries:c.maxRetries,retryDelay:c.retryDelay})}});Ext.define("AB.data.proxy.WampProxy",{extend:Ext.data.proxy.Server,alias:"proxy.wamp",batchActions:false,constructor:function(a){var b=this;a=a||{};b.addEvents("exception","oncreate","onupdate","ondestroy");AB.data.proxy.WampProxy.superclass.constructor.apply(b,arguments);b.session=absession;b.api=Ext.apply({},a.api||b.api);if(b.api.oncreate){b.session.subscribe(b.api.oncreate,function(c,d){if(b.debug){console.log("AB.data.proxy.WampProxy.oncreate",d)}var e=d;b.fireEvent("oncreate",b,e)})}if(b.api.onupdate){b.session.subscribe(b.api.onupdate,function(c,d){if(b.debug){console.log("AB.data.proxy.WampProxy.onupdate",d)}var e=d;b.fireEvent("onupdate",b,e)})}if(b.api.ondestroy){b.session.subscribe(b.api.ondestroy,function(c,d){if(b.debug){console.log("AB.data.proxy.WampProxy.ondestroy",d)}var e=d;b.fireEvent("ondestroy",b,e)})}},create:function(b,e,c){var d=this;if(d.debug){console.log("AB.data.proxy.WampProxy.create",b)}if(b.records.length>1){throw"WAMP proxy cannot process multiple CREATEs at once"}var a=b.records[0];b.setStarted();this.session.call(this.api.create,a.data).then(function(f){a.phantom=false;a.setId(f.id);a.commit();b.setCompleted();b.setSuccessful();if(typeof e==="function"){e.call(c||d,b)}},function(f){if(d.debug){console.log("WAMP RPC error",f)}b.setException(f.desc);d.fireEvent("exception",d,f,b);if(typeof e==="function"){e.call(c||d,b)}})},update:function(b,e,c){var d=this;if(d.debug){console.log("AB.data.proxy.WampProxy.update",b)}if(b.records.length>1){throw"WAMP proxy cannot process multiple UPDATEs at once"}var a=b.records[0];b.setStarted();this.session.call(this.api.update,a.data).then(function(f){a.commit();b.setCompleted();b.setSuccessful();if(typeof e==="function"){e.call(c||d,b)}},function(f){if(d.debug){console.log("WAMP RPC error",f)}b.setException(f.desc);d.fireEvent("exception",d,f,b);if(typeof e==="function"){e.call(c||d,b)}})},destroy:function(a,e,b){var c=this;if(c.debug){console.log("AB.data.proxy.WampProxy.destroy",a)}if(a.records.length>1){throw"WAMP proxy cannot process multiple DESTROYs at once"}a.setStarted();var d=a.records[0].getId();this.session.call(this.api.destroy,d).then(function(){a.setCompleted();a.setSuccessful();if(typeof e==="function"){e.call(b||c,a)}},function(f){if(c.debug){console.log("WAMP RPC error",f)}a.setException(f.desc);c.fireEvent("exception",c,f,a);if(typeof e==="function"){e.call(b||c,a)}})},read:function(a,f,c){var d=this;var b;if(d.debug){console.log("AB.data.proxy.WampProxy.read",a)}var e=a.params=Ext.apply({},a.params,d.extraParams);Ext.applyIf(e,d.getParams(a));if(a.id!==undefined&&e[d.idParam]===undefined){e[d.idParam]=a.id}this.session.call(this.api.read,e).then(function(i){var h=d.getReader(),g;h.applyDefaults=true;g=h.read(i);g.total=Math.max(g.total,d.total||0);Ext.apply(a,{response:i,resultSet:g});a.commitRecords(g.records);a.setCompleted();a.setSuccessful();if(typeof f==="function"){f.call(c||d,a)}},function(g){d.setException(a,g.desc);d.fireEvent("exception",this,g.desc,a);if(typeof f==="function"){f.call(c||d,a)}d.afterRequest(request,success)})}},function(){});Ext.define("AB.form.action.WampSubmit",{extend:Ext.form.action.Submit,alternateClassName:"AB.form.Action.WampSubmit",alias:"formaction.wampsubmit",type:"wampsubmit",doSubmit:function(){var a=this;var b=a.getParams();if(a.api.debug){console.log("AB.form.action.WampSubmit.doSubmit",a.api,b)}if(!(a.api.session&&a.api.session._websocket_connected&&a.api.submit)){a.failureType=Ext.form.action.Action.CONNECT_FAILURE;a.form.afterAction(a,false)}else{a.api.session.call(a.api.submit,b).then(function(c){if(a.api.debug){console.log("Form Submit Success",c)}a.result=c;a.form.afterAction(a,true)},function(c){if(a.api.debug){console.log("Form Submit Error",c)}if(c.details){}a.failureType=Ext.form.action.Action.SERVER_INVALID;a.result=c;a.form.afterAction(a,false)})}}});Ext.define("AB.form.action.WampLoad",{extend:Ext.form.action.Load,alternateClassName:"AB.form.Action.WampLoad",alias:"formaction.wampload",type:"wampload",run:function(){console.log("where is the wamp load?");var a=this;var b=a.getParams();if(a.api.debug){console.log("AB.form.action.WampLoad.run",a.api,b)}if(!(a.api.session&&a.api.session._websocket_connected&&a.api.load)){a.failureType=Ext.form.action.Action.CONNECT_FAILURE;a.form.afterAction(a,false)}else{a.api.session.call(a.api.load,b).then(function(c){if(a.api.debug){console.log("Form Load Success",c)}a.form.clearInvalid();a.form.setValues(c);a.form.afterAction(a,true)},function(c){if(a.api.debug){console.log("Form Load Error",c)}a.failureType=Ext.form.action.Action.LOAD_FAILURE;a.form.afterAction(a,false)})}}});Ext.define("AB.form.Basic",{override:"Ext.form.Basic",submit:function(a){if(this.api&&this.api.type==="wamp"){return this.doAction("wampsubmit",a)}else{return this.doAction(this.standardSubmit?"standardsubmit":this.api?"directsubmit":"submit",a)}},load:function(a){if(this.api&&this.api.type==="wamp"){return this.doAction("wampload",a)}else{return this.doAction(this.api?"directload":"load",a)}},doAction:function(c,b){if(Ext.isString(c)){var a={form:this};if(this.api&&this.api.type==="wamp"){a.api=this.api}c=Ext.ClassManager.instantiateByAlias("formaction."+c,Ext.apply({},b,a))}if(this.fireEvent("beforeaction",this,c)!==false){this.beforeAction(c);c.run()}return this}});