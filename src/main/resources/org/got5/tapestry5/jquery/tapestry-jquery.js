(function($) {

    /**
     * Logger based on console
     * @param {Object} msg to log
     */
    jQuery.fn.log = function(msg) {
        if (Tapestry.DEBUG_ENABLED && typeof console != "undefined" && typeof console.log != "undefined") 
            console.log("%s: %o", msg, this);
        
        return this;
    };
    
    $.extend(Tapestry, {
        waitForPage: function() {
            return;
        },
        
        onDOMLoaded: function(callback) {
            $(document).ready(callback);
        },
        
        init: function(specs) {
            $.each(specs, function(functionName, params) {
                var initf = Tapestry.Initializer[functionName];
                
                if (initf == undefined) {
                    $().log("No Tapestry.Initializer function for : " + functionName);
                }
                
                $.each(params, function(i, paramList) {
                
                    if (!jQuery.isArray(paramList)) {
                        paramList = [paramList];
                    }
                    
                    initf.apply(this, paramList);
                });
            });
        },
        
        /** 
         * Key for storing virtualScripts data in the DOM
         */
        VIRTUAL_SCRIPTS: 'tapestry.virtualScripts',
        
        markScriptLibrariesLoaded: function(scripts) {
            var virtualScripts = $('html').data(Tapestry.VIRTUAL_SCRIPTS);
            $.each(scripts, function(i, script) {
                var complete = $.tapestry.utils.rebuildURL(script);
                virtualScripts.push(complete);
            });
            
            $('html').data(Tapestry.VIRTUAL_SCRIPTS, virtualScripts);
        }
    });
    
    /** Container of functions that may be invoked by the Tapestry.init() function. */
    $.extend(Tapestry.Initializer, {
    
        ajaxFormLoop: function(spec) {
        
            $.each(spec.addRowTriggers, function(index, triggerId) {
            
                $("#" + triggerId).click(function(event) {
                
                    $.tapestry.formInjector.trigger(spec.rowInjector);
                    
                    return false;
                })
            });
        },
        
        formInjector: function(spec) {
            $("#" + spec.element).tapestryFormInjector(spec);
        },
        
        formLoopRemoveLink: function(spec) {
            defaults = {
                effect: "blind",
            };
            
            spec = $.extend(defaults, spec);
            
            var link = $("#" + spec.link);
            
            var fragmentId = spec.fragment;
            
            link.click(function(e) {
            
                var successHandler = function(data) {
                
                    var container = $("#" + fragmentId);
                    
                    var fragment = container.data("tapestry.formFragment");
                    
                    if (fragment != undefined) {
                        // TODO : reimplement fragment.hideAndRemove();
                    }
                    else {
                        var options = {};
                        container.hide(spec.effect, options, "normal", function() {
                            container.remove();
                        });
                    }
                }
                
                $.ajax({
                    url: spec.url,
                    success: successHandler
                });
                
                return false;
            });
        },
        
        /**
         * Convert a form or link into a trigger of an Ajax update that
         * updates the indicated Zone.
         * @param element id or instance of <form> or <a> element
         * @param zoneId id of the element to update when link clicked or form submitted
         * @param url absolute component event request URL
         */
        linkZone: function(element, zoneId, url) {
            jQueryElement = $('#' + element);
            
            if (jQueryElement.is('form')) {
                jQueryElement.submit(function() {
                    $.tapestry.zone.update(zoneId, url, jQueryElement.serialize());
                    return false;
                });
            }
            else {
                jQueryElement.click(function() {
                    $.tapestry.zone.update(zoneId, url);
                    return false;
                });
            }
        },
        
        zone: function(spec) {
            if (!jQuery.isPlainObject(spec)) {
                spec = {
                    element: spec
                };
            }
            
            $('#' + spec.element).tapestryZone();
        }
        
    });
    
    /**
     * Zone plugin
     * @param {Object} options
     */
    $.fn.tapestryZone = function(options) {
        var options = $.extend($.fn.tapestryZone.defaults, options);
        return this.each(function() {
            $(this).data('tapestry.show', options.show);
            $(this).data('tapestry.update', options.update);
        });
        
    };
    
    $.fn.tapestryZone.defaults = {
        show: "highlight",
        update: "hightlight"
    };
    
    /**
     * Form Injector
     */
    $.fn.tapestryFormInjector = function(options) {
        var options = $.extend($.fn.tapestryFormInjector.defaults, options);
        var element = $('#' + options.element);
        
        return element.each(function() {
            $(this).data("tapestry.formInjector", options);
        });
        
    };
    
    $.fn.tapestryFormInjector.defaults = {
        show: "highlight"
    };
    
    /**
     * Tapestry static functions
     */
    $.tapestry = {
        utils: {
            /**
             * Used to reconstruct a complete URL from a path that is (or may be) relative to window.location.
             * This is used when determining if a JavaScript library or CSS stylesheet has already been loaded.
             * Recognizes complete URLs (which are returned unchanged), otherwise the URLs are expected to be
             * absolute paths.
             *
             * @param path
             * @return complete URL as string
             */
            rebuildURL: function(path) {
                if (path.match(/^https?:/)) {
                    return path;
                }
                
                if (path.indexOf("/") !== 0) {
                    $(this).log(Tapestry.Messages.pathDoesNotStartWithSlash + " " + path);
                    
                    return path;
                }
                
                var l = window.location;
                return l.protocol + "//" + l.host + path;
            },
            
            /**
             * Add scripts, as needed, to the document, then waits for them all to load, and finally, calls
             * the callback function.
             * @param scripts Array of scripts to load
             * @param callback invoked after scripts are loaded
             */
            addScripts: function(scripts, callback) {
                if (scripts) {
                
                    $.each(scripts, function(i, s) {
                        var assetURL = $.tapestry.utils.rebuildURL(s);
                        var virtualScripts = $('html').data(Tapestry.VIRTUAL_SCRIPTS);
                        
                        if (virtualScripts == undefined) {
                            virtualScripts = [];
                            
                            $('script[src]').each(function(i, script) {
                                path = $(script).attr('src');
                                virtualScripts.push($.tapestry.utils.rebuildURL(path));
                            });
                        }
                        
                        if ($.inArray(assetURL, virtualScripts) == -1) {
                            $('head').append('<script src="' + assetURL + '" type="text/javascript" />');
                            virtualScripts.push(assetURL);
                        }
                        
                        $('html').data(Tapestry.VIRTUAL_SCRIPTS, virtualScripts);
                    });
                    
                }
                
                // TODO : re-implement scriptLoadMonitor
                callback.call(this);
            },
            
            addStylesheets: function(stylesheets) {
                if (stylesheets) {
                    $.each(stylesheets, function(i, s) {
                        var assetURL = $.tapestry.utils.rebuildURL(s.href);
                        
                        if ($('head link[href="' + assetURL + '"]').size() == 0) {
                        
                            stylesheet = '<link href="' + assetURL + '" type="text/css" rel="stylesheet"';
                            
                            if (s.media != undefined) 
                                stylesheet += ' media="' + s.media + '" ';
                            
                            stylesheet += '/>';
                            
                            $('head').append(stylesheet);
                        }
                    });
                }
            },
            
            /**
             * Passed the JSON content of a Tapestry partial markup response, extracts
             * the script and stylesheet information.  JavaScript libraries and stylesheets are loaded,
             * then the callback is invoked.  All three keys are optional:
             * <dl>
             * <dt>redirectURL</dt> <dd>URL to redirect to (in which case, the callback is not invoked)</dd>
             * <dt>scripts</dt><dd>Array of strings (URIs of scripts)</dd>
             * <dt>stylesheets</dt><dd>Array of hashes, each hash has key href and optional key media</dd>
             *
             * @param reply JSON response object from the server
             * @param callback function invoked after the scripts have all loaded (presumably, to update the DOM)
             */
            loadScriptsInReply: function(reply, callback) {
                var redirectURL = reply.redirectURL;
                
                if (redirectURL) {
                    // Check for complete URL.
                    if (/^https?:/.test(redirectURL)) {
                        window.location = redirectURL;
                        return;
                    }
                    
                    window.location.pathname = redirectURL;
                    
                    // Don't bother loading scripts or invoking the callback.
                    return;
                }
                
                $.tapestry.utils.addStylesheets(reply.stylesheets);
                
                $.tapestry.utils.addScripts(reply.scripts, function() {
                    
					// TODO : reimplement callback					
					if (callback != undefined)
                    	callback.call(this);
                    
                    if (reply.script) 
                        eval(reply.script);
                    
                });
            }
        },
        
        /**
         * Zone manipulation
         */
        zone: {
            /**
             * Refresh a zone
             * @zoneId
             * @url to request
             * @params optional, can contain data. Request will switch from GET to POST
             */
            update: function(zoneId, url, params) {
                ajaxRequest = {
                    url: url,
                    success: function(data) {
                        $('#' + zoneId).html(data.content).effect(effect);
                        $.tapestry.utils.loadScriptsInReply(data);
                    }
                };
                
                if (params != undefined) {
                    ajaxRequest = $.extend(ajaxRequest, {
                        type: 'post',
                        data: params
                    })
                }
                
                effect = $('#' + zoneId).is(":visible") ? $('#' + zoneId).data('tapestry.show') : $('#' + zoneId).data('tapestry.update');
                
                $.ajax(ajaxRequest);
            }
        },
        
        /**
         * Form Injector
         */
        formInjector: {
            trigger: function(formInjectorId) {
                var formInjector = $("#" + formInjectorId);
                
                var successHandler = function(data) {
                
                    $.tapestry.utils.loadScriptsInReply(data, function() {
                        // Clone the FormInjector element (usually a div)
                        // to create the new element, that gets inserted
                        // before or after the FormInjector's element.
                        
                        var newElement = formInjector.clone().attr("id", data.elementId).html(data.content);
                        
                        newElement = formInjector.data('tapestry.formInjector').below ? formInjector.after(newElement) : formInjector.before(newElement);
                        
                        newElement.effect(formInjector.data('tapestry.formInjector').show);
                        
                    });
                    
                };
                
                $.ajax({
                    url: formInjector.data('tapestry.formInjector').url,
                    success: successHandler
                });
            }
        }
    };
    
})(jQuery);







