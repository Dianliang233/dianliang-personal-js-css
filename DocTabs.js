//[[en:User:Majr/docTabs.js]] 汉化
$( function() {
    'use strict';
    
    
    var namespace = mw.config.get( 'wgCanonicalNamespace' ).replace( '_talk', '' ),
        title = mw.config.get( 'wgTitle' ),
        mainPage = namespace + ':' + title.replace( /\/doc$/, '' ),
        mainPageTalk = namespace + ' talk:' + title.replace( /\/doc$/, '' );
    
    $( '#p-namespaces li:last' ).after(
        $( '<li id="ca-doc">' ).html(
            $( '<span>' ).html(
                $( '<a>' ).prop( {
                    title: '查看文档页面',
                    href: '/' + mainPage.replace( / /g, '_' ) + '/doc'
                } ).text( '文档' )
            )
        ),
        $( '<li id="ca-doc-talk">' ).html(
            $( '<span>' ).html(
                $( '<a>' ).prop( {
                    title: '讨论文档页面',
                    href: '/' + mainPageTalk.replace( / /g, '_' ) + '/doc'
                } ).text( '文档讨论' )
            )
        )
    );
    
    if ( title.search( /\/doc$/ ) > -1 ) {
        $( '#ca-talk,#ca-nstab-' + namespace.toLowerCase() ).removeClass( 'selected' ).find( 'a' ).prop( 'href', function() {
            return this.href.replace( /\/doc(&|$)/, '$1' );
        } );
        
        if ( mw.config.get( 'wgCanonicalNamespace' ).indexOf( '_talk' ) > -1 ) {
            $( '#ca-doc-talk' ).addClass( 'selected' );
        } else {
            $( '#ca-doc' ).addClass( 'selected' );
        }
    }
    
    mw.loader.using( 'mediawiki.api', function() {
        new mw.Api().get( {
            action: 'query',
            prop: 'info',
            titles: [ mainPage, mainPageTalk, mainPage + '/doc', mainPageTalk + '/doc' ].join( '|' )
        } ).done( function( data ) {
            var nameToId = {};
            nameToId[mainPage] = '#ca-nstab-' + namespace.toLowerCase();
            nameToId[mainPageTalk] = '#ca-talk';
            nameToId[mainPage + '/doc'] = '#ca-doc';
            nameToId[mainPageTalk + '/doc'] = '#ca-doc-talk';
    
            $.each( data.query.pages, function() {
                var id = nameToId[this.title];
                
                if ( $( id ).hasClass( 'new' ) ) {
                    if ( !this.hasOwnProperty( 'missing' ) ) {
                        $( id ).removeClass( 'new' ).find( 'a' ).prop( 'href', function() {
                            return this.href.replace( /index\.php\?title=([^&]+)&action=edit&redlink=1/, '$1' );
                        } );
                    }
                } else if ( this.hasOwnProperty( 'missing' ) ) {
                    $( id ).addClass( 'new' ).find( 'a' ).prop( 'href', function() {
                        return this.href.replace( /gamepedia\.com\/(.+)/, 'gamepedia.com/index.php?title=$1&action=edit&redlink=1' );
                    } );
                }
            } );
        } ).fail( function( error ) {
            console.error( error );
        } );
    } );
    
    
    } );