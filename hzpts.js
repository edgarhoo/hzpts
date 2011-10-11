/**
 * @fileoverview javascript for HZPTS
 * @author Edgar
 * @build 111012
 * */
 
(function( $, define, register ){
    
    /**
     * @module search type
     * */
    define( 'type', function( require, exports ){
        var $input = $('div.input')[0],
        
        current = $('div.type input:checked').val(),
        
        set = function(){
            $input.className = 'input current-' + current;
        };
        
        exports.get = function(){
            return current;
        },
        
        exports.init = function(){
            set();
        };
        
        $('div.type input').bind( 'change', function(){
            current = $(this).val();
            set();
        } );
    } );
    
    /**
     * @module geo data
     * */
    define( 'geoData', function( require, exports ){
        var geoData = {};
        
        exports.get = function( address ){
            var geo = null;
            if ( !!geoData[address] ){
                geo = geoData[address];
            }
            return geo;
        };
        
        exports.set = function( address, o ){
            if ( !!geoData[address] ){
                return;
            }
            geoData[address] = {
                'lat': o.lat,
                'lon': o.lon
            };
        };
    } );
    
    /**
     * @module message
     * */
    define( 'message', function( require, exports ){
        var $p = $('div.message p'),
        tips = {
            'ERROR': '查询失败，请重试！',
            'ZERO': '查询无结果，请更换搜索词！',
            'SEARCHING': '正在查询中……'
        };
        
        exports.show = function(type){
            $p.html(tips[type]);
        };
        
        exports.hide = function(){
            $p.html('');
        };
    } );
    
    /**
     * @module validation
     * */
    define( 'validation', function( require, exports ){
        var message = require('message');
        
        $('div.input input').bind( 'focus', function(){
            $(this).removeClass('error');
            message.hide();
        } );
        
        exports.is = function( $input ){
            if ( !!$input.val() ){
                message.show('SEARCHING');
                return true;
            }
            $input.addClass('error');
            return false;
        };
    } );
    
    /**
     * @module render search result
     * */
    define( 'render', function( require, exports ){
        var $output = $('div.output'),
            message = require('message'),
            guid = 0,
            currentLine,
            $currentItem,
            currentStation;
        
        createItem = function(){
            var $item = $('<div/>').attr( 'id', 'item-' + guid++ );
            $output.prepend( $item );
            return $item;
        },
        
        lineClick = function( $item, bus ){
            $item.delegate( 'a.line', 'click', function(e){
                e.preventDefault();
                var $this = $(this);
                if ( 'true' === $this.attr('data-loaded') ){
                    return;
                }
                currentLine = bus.lines[$this.data('idx')];
                $currentItem = $this.closest('div.item');
                bus.requestLineStops( currentLine );
                $this.attr( 'data-loaded', 'true' );
            } );
        },
        
        stationClick = function( $item, bus ){
            $item.delegate( 'a.station', 'click', function(e){
                e.preventDefault();
                var $this = $(this);
                if ( 'true' === $this.attr('data-loaded') ){
                    return;
                }
                currentStation = bus.stations[$this.data('idx')];
                $currentItem = $this.closest('div.item');
                bus.requestStationStops(currentStation);
                $this.attr( 'data-loaded', 'true' );
            } );
        },
        
        renderRoute = function(route){
            var step, html, ol = '';
            for ( var i = 0, l = route.steps.length; i < l; i++ ){
                step = route.steps[i];
                switch( step.type.toLowerCase() ){
                    case 'bus':
                        html = '乘坐<strong class="line">' + step.line.name + '</strong>，从<span class="station">' + step.fromPoint.name + '</span>到<span class="station">' + step.toPoint.name + '</span>';
                        break;
                    case 'walk':
                        html = '从' + ( i === 0 ? '起点' : '<span class="station">' + step.fromPoint.name + '</span>' ) + '步行到' + ( i === l - 1 ? '终点' : '<span class="station">' + step.toPoint.name + '</span>' );
                        break;
                }
                ol += '<li>' + html + '</li>';
            }
            return '<ol class="item">' + ol + '</ol>';
        },
        
        renderLines = function( line, i ){
            return '<div class="item"><p><a class="line" data-idx="' + i + '" href="#">' + line.fullName + '</a></p></div>';
        },
        
        renderStations = function( station, i ){
            return '<div class="item"><p><a class="station" data-idx="' + i + '" href="#">' + station.name + '</a></p></div>';
        };
        
        exports.route = function(bus){
            var routes = bus.routes,
                routesLength = routes.length,
                $item, ul = '';
            
            message.hide();
            
            if ( 0 === routesLength ){
                message.show('ZERO');
                return;
            }
            
            $item = createItem();
            
            $.each( routes, function( i, route ){
                if ( !route ){
                    return;
                }
                ul += '<li>' + renderRoute(route) + '</li>';
            } );
            
            $item.html( '<ul>' + ul + '</ul>' );
        };
        
        exports.lines = function(bus){
            var lines = bus.lines,
                linesLength = lines.length,
                $item, ul = '';
            
            message.hide();
            
            if ( 0 === linesLength ){
                message.show('ZERO');
                return;
            }
            
            $item = createItem();
            
            $.each( lines, function( i, line ){
                if ( !line ){
                    return;
                }
                ul += '<li>' + renderLines( line, i ) + '</li>';
            } );
            
            $item.html( '<ul>' + ul + '</ul>' );
            
            lineClick( $item, bus );
        };
        
        exports.line = function(bus){
            var stops = currentLine.stops,
                stopsLength = stops.length,
                i, p = '';
            
            for ( i = 0; i < stopsLength; i++ ){
                p += stops[i].name + ( i === stopsLength -1 ? '' : ' &gt; ');
            }
            $currentItem.append( '<p>' + p + '<p>');
        };
        
        exports.stations = function(bus){
            var stations = bus.stations,
                stationsLength = stations.length,
                $item, ul = '';
            
            message.hide();
            
            if ( 0 === stationsLength ){
                message.show('ZERO');
                return;
            }
            
            $item = createItem();
            
            $.each( stations, function( i, station ){
                if ( !station ){
                    return;
                }
                ul += '<li>' + renderStations( station, i ) + '</li>';
            } );
            
            $item.html( '<ul>' + ul + '</ul>' );
            
            stationClick( $item, bus );
        };
        
        exports.station = function(bus){
            var stops = currentStation.stops,
                stopsLength = stops.length,
                i, ul = '';
            
            for ( i = 0; i < stopsLength; i++ ){
                ul += '<li>' + stops[i].line.fullName + '</li>';
            }
            $currentItem.append( '<ul>' + ul + '<ul>');
        };
    } );
    
    /**
     * @module route
     * */
    define( 'route', function( require, exports ){
        var data = require('geoData'),
            render = require('render'),
            message = require('message'),
            geoApiUrl = 'http://gc.ditu.aliyun.com/geocoding',
        
        getGeo = function( address, from, to ){
            $.ajax({
                url: geoApiUrl,
                type: 'GET',
                data: 'a=杭州' + address,
                dataType: 'jsonp',
                jsonp: 'b',
                jsonpCallback: function(){
                    return 'hzpts' + $.now();
                },
                success: function(o){
                    if ( o.level !== -1 ){
                        data.set( address, o );
                        search( from, to );
                        return;
                    }
                    message.show('ERROR');
                },
                error: function(){
                    message.show('ERROR');
                }
            });
        },
        
        getRoute = function( geoFrom, geoTo ){
            var bus = new AliBus();
            AliEvent.addListener( bus, 'routecomplete', function(){
                render.route(bus);
            } );
            bus.fromLatLng = new AliLatLng( geoFrom.lat, geoFrom.lon );
            bus.toLatLng = new AliLatLng( geoTo.lat, geoTo.lon );
            bus.execute();
        },
        
        search = function( from, to ){
            var geoFrom = data.get(from),
                geoTo = data.get(to);
                
            !!geoFrom && !!geoTo && getRoute( geoFrom, geoTo );
        };
        
        exports.search = function( from, to ){
            var geoFrom = data.get(from),
                geoTo = data.get(to);
            
            !!geoFrom || getGeo( from, from, to );
            !!geoTo || getGeo( to, from, to );
            
            !!geoFrom && !!geoTo && getRoute( geoFrom, geoTo );
        };
    } );
    
    /**
     * @module line
     * */
    define( 'line', function( require, exports ){
        var render = require('render');
        
        exports.search = function( text ){
            var bus = new AliBus();
            
            AliEvent.addListener( bus, 'linessearchcomplete', function(){
                render.lines(bus);
            } );
            AliEvent.addListener( bus, 'linestopscomplete', function(){
                render.line(bus);
            } );
            
            bus.city = '330100';
            bus.lineSearchKey = text;
            bus.executeLinesSearch();
        };
    } );
    
    /**
     * @module station
     * */
    define( 'station', function( require, exports ){
        var render = require('render');
        
        exports.search = function( text ){
            var bus = new AliBus();
            
            AliEvent.addListener( bus, 'stationssearchcomplete', function(){
                render.stations(bus);
            } );
            AliEvent.addListener( bus, 'stationstopscomplete', function(){
                render.station(bus);
            } );
            
            bus.city = '330100';
            bus.stationSearchKey = text;
            bus.stationPageSize = 20;
            bus.executeStationsSearch();
        };
    } );
    
    /**
     * page init
     * */
    define(function( require, exports ){
        var type = require('type'),
            message = require('message'),
            is = require('validation').is,
            route = require('route'),
            line = require('line'),
            station = require('station'),
            $from = $('#route-from'),
            $to = $('#route-to'),
            $line = $('#line-name'),
            $station = $('#station-name'),
        
        submit = function(){
            message.hide();
            switch( type.get() ){
                case 'route':
                    is( $from ) && is( $to ) && route.search( $from.val(), $to.val() );
                    break;
                case 'line':
                    is( $line ) && line.search( $line.val() );
                    break;
                case 'station':
                    is( $station ) && station.search( $station.val() );
                    break;
            }
        };
        
        type.init();
        
        $('div.button button').bind( 'click', submit );
    }).register();
    
})( jQuery, hexjs.define, hexjs.register );
