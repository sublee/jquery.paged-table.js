/**
    jquery.paged-table.js
    ~~~~~~~~~~~~~~~~~~~~~

    Adds a pager to a <table>.
*/

(function( $ ) {
PagedTable = function( selector, options ) {
    /** Changes a <table> to which has a pager::

        var pt = new PagedTable( "table:eq(0)", { limit: 10 });

    The result is::

        +----+-------------------------+
        | id |         subject         |
        +----+-------------------------+
        |  1 | team lunant             |
        |  2 | the selfish gene        |
        |  3 | the genographic project |
        |  4 | pixelart                |
        |  5 | lee, heungsub           |
        +----+-------------------------+
         [1] 2 3 4 5 >

    It has some options.

    limit
        Rows in each page(default: ``5``)
    pageLimit
        Pages in each pager(default: ``10``)
    started
        The default page(default: ``1``)
    insertPager
        Inserts pager element at initialized if it is true(default: ``true``)
    dragPager
        Makes able to drag pagers in table if it is true(default: ``false``)
    fixedWidth
        Set width fixed if it is true(default: ``true``)
    pager
        The pager element expression(default: ``<p class='pager'></p>``)
    page
        The page element expression(default: ``<a href='#'></a>``)
    prev
        The previous page element expression(default:
        ``<a href='#'>&laquo;</a>``)
    next
        The next page element expression(default: ``<a href='#'>&raquo;</a>``)
    selectedClass
        The class to add a selected page element(default: ``selected``)

    :param selector: A <table> element to apply :class:`PagedTable`.
    :param options: An object with options.
    */
    this.options = $.extend({}, this.options, options );
    this.element = $( selector ).eq( 0 );
    this.initialize();
};

PagedTable.version = "0.10.0";
PagedTable.updated = "2010-09-03 10:26";

PagedTable.prototype.options = {
    limit: 5,
    pageLimit: 10,
    started: 1,
    insertPager: true,
    dragPager: false,
    fixedWidth: true,
    pager: "<p class='pager'></p>",
    page: "<a href='#'></a>",
    prev: "<a href='#'>&laquo;</a>",
    next: "<a href='#'>&raquo;</a>",
    selectedClass: "selected"
};

PagedTable.prototype.initialize = function() {
    var self = this;

    this.rows = $( "tbody > tr", this.element );
    this.length = this.rows.length;
    this.pages = Math.ceil( this.length / this.options.limit );
    this.pagers = [];

    var divide = function( elements, limit ) {
        var divided = [];
        elements.each(function(i) {
            if ( i % limit === 0 ) {
                divided.push([]);
            }
            divided[ divided.length - 1 ].push( this );
        });
        return divided;
    };
    this.rows.divided = divide( this.rows, this.options.limit );

    if ( this.options.fixedWidth ) {
        this.element.find( "th" ).each(function() {
            var th = $( this );
            th.width( th.width() + 1 );
        });
    }
    if ( this.options.insertPager ) {
        this.pager().insertAfter( this.element );
    }
    if ( this.options.pageLimit < 0 ) {
        this.options.pageLimit = this.pages;
    }

    return this.goto( this.options.started );
};

PagedTable.prototype.pager = function() {
    /** Returns new pager element.

        >>> var pager = pt.pager();
        >>> pager instanceof jQuery;
        true

    If you want to clone a pager before the table::

        pager.insertBefore( tp.element );

    The result is::

         [1] 2 3 4 5 >
        +----+-------------------------+
        | id |         subject         |
        +----+-------------------------+
        |  1 | team lunant             |
        |  2 | the selfish gene        |
        |  3 | the genographic project |
        |  4 | pixelart                |
        |  5 | lee, heungsub           |
        +----+-------------------------+
         [1] 2 3 4 5 >
    */
    var pager;
    if ( !this.pagers.length ) {
        var self = this,
            options = this.options;

        pager = $( options.pager );

        var mousedown = options.dragPager ? function() {
                PagedTable.dragged = pager;
            } : null, 
            click = function() {
                self.goto( $( this ).text() );
                return false;
            };

        $( options.prev ).click(function() {
            var m = Math.ceil( self.page / options.pageLimit ) - 1,
                i = options.pageLimit * m;
            self.goto( i );
            return false;
        }).appendTo( pager );

        for ( var i = 0; i < Math.min( this.pages ); i++ ) {
            var page = $( options.page );
            page.text( i + 1 ).click( click );
            page.mousedown( mousedown ).appendTo( pager );
        }

        $( options.next ).click(function() {
            var m = Math.ceil( self.page / options.pageLimit ),
                i = options.pageLimit * m + 1;
            self.goto( i );
            return false;
        }).appendTo( pager );

        if ( options.dragPager ) {
            var win = $( $.browser.msie ? document.body : window ),
                d = function( p1, p2 ) {
                    var x = Math.pow( p1[0] - p2[0], 2 ),
                        y = Math.pow( p1[1] - p2[1], 2 );
                    return Math.sqrt( x + y );
                };
            win.mousemove(function( e ) {
                var dragged = PagedTable.dragged;

                if ( dragged ) {
                    var cursor = [ e.pageX, e.pageY ],
                        range = self._range(),
                        ds = [],
                        pages = [],
                        getDistance = function() {
                            var page = $( this ),
                                pos = page.position(),
                                x = pos.left + page.width() / 2,
                                y = pos.top + page.height() / 2,
                                center = [ x, y ],
                                distance = d( cursor, center );
                            if ( ds.length && ds[ ds.length - 1 ] < distance ) {
                                return false;
                            }
                            ds.push( distance );
                            pages.push( page );
                        },
                        pages = $( dragged ).children();

                    pages = pages.slice( range[0], range[1] + 1 );
                    pages.each( getDistance );

                    var i = $.inArray( Math.min.apply( null, ds ), ds );
                    pages.eq( i ).click();

                    return false;
                }
            }).mouseup(function() {
                PagedTable.dragged = null;
            });
        }
    } else {
        pager = this.pagers[ 0 ].clone( true );
    }

    this.pagers.push( pager );

    return pager;
};

PagedTable.prototype.goto = function( page ) {
    /** Goes to certain page::

        tp.goto( 14 );

    The result is::

         < 11 12 13 [14] 15 >
        +----+-------------------------+
        | id |         subject         |
        +----+-------------------------+
        | 66 | Hong, Minhee            |
        | 67 | Kim, Jaeseok            |
        | 68 | Kang, Sungryong         |
        | 69 | Lee, Donggeun           |
        | 70 | Lunant Forever!!        |
        +----+-------------------------+
         < 11 12 13 [14] 15 >
    */
    var self = this,
        options = this.options;
        page = page < 1 ? 1 : page > this.pages ? this.pages : page,
        range = this._range(), newrange = this._range( page ),
        from = (page - 1) * this.options.limit,
        to = page * this.options.limit;

    (this._visibleRows || this.rows).hide();
    this._visibleRows = $( this.rows.divided[ page - 1 ] ).show();

    $( this.pagers ).each(function() {
        var selected = options.selectedClass;
            children = $( this ).children();
            length = self.length;

        if ( length ) {
            children.slice( 1, self.pages + 1 ).hide();
            children.slice( range[0], range[1] + 1 ).removeClass( selected );
            children.slice( newrange[0], newrange[1] + 1 ).show();
            children.eq( page ).addClass( selected );
        }

        var prev = children.eq( 0 ),
            next = children.eq( self.pages + 1 );

        if ( !length || newrange[ 0 ] === 1 ) {
            prev.hide();
        } else {
            prev.show();
        }
        if ( !length || self.pages <= newrange[ 1 ] ) {
            next.hide();
        } else {
            next.show();
        }
    });

    this.page = page;
    return this;
};

PagedTable.prototype.revert = function() {
    var self = this;
    $( this.pagers ).empty();
    $( this.rows ).show();
    $.each([ "pagers", "page", "rows", "_visibleRows" ], function() {
        delete self[ this ];
    });
    return this;
};

PagedTable.prototype._range = function( page ) {
    page = page || this.page;
    var pageLimit = this.options.pageLimit,
        from = Math.ceil(page / pageLimit - 1) * pageLimit + 1,
        to = Math.ceil(page / pageLimit) * pageLimit;
    return [ from, to ];
};

$.fn.extend({
    pagedTable: function( options ) {
        this.data( "pagedTable", new PagedTable( this, options ) );
        return this;
    },
    pageable: function( options ) {
        var warn = function( msg ) {
            return console && console.warn && console.warn( msg );
        }, msg;
        
        msg = "`$.fn.pageable` is deprecated on version 0.10.0. ";
        msg += "Use `$.fn.pagedTable` instead of this.";
        warn( msg );

        if ( options ) {
            for ( var opt in PagedTable.prototype.options ) {
                var lowerOpt = opt.toLowerCase();
                if ( opt !== lowerOpt && lowerOpt in options ) {
                    msg = "`" + lowerOpt + "` option is deprecated on ";
                    msg += "version 0.10.0. Use `" + opt + "` instead of "
                    msg += "this.";
                    warn( msg );

                    options[ opt ] = options[ lowerOpt ];
                }
            }
        }

        return this.pagedTable( options ).data( "pagedTable" );
    }
});

})(jQuery);

