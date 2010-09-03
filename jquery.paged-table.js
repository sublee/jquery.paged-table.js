/**
 * Copyright (c) 2009 Lee, Heungsub <lee@heungsub.net>
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 * @module PagedTable 0.9.1 Beta
 * @author Lee, Heungsub <lee@heungsub.net>
 * @description Change table to which has a pager.
 * @link http://heungsub.net/apps/pagedtable
 * @requires jQuery 1.3.x
 * @thanks Choi, Jonghyun <jonghyun@lunant.net>
 */

(function($) {
PagedTable = function(selector, options) {
    /** Change table to which has a pager.

    Syntax:
        new PagedTable(selector[, options]);

    Arguments:
        1. selector - (expression) A <table> element to apply PagedTable.
        2. options - (object, optional) An object with options.

    Options:
        * limit - (number: defaults to 5) Rows in each page.
        * pagelimit - (number: defaults to 10) Pages in each pager.
        * started - (number: defaults to 1) The default page.
        * insertpager - (boolean: defaults to true)
            Insert pager element at initialized if it is true.
        * dragpager - (boolean: defaults to false)
            Makes able to drag pagers in table if it is true.
        * fixedwidth - (boolean: defaults to true)
            Set width fixed if it is true.
        * pager - (expression: defaults '<p class="pager"></p>')
            Pager element expression.
        * page - (expression: defaults '<a href="#"></a>')
            Page element expression.
        * prev - (expression: defaults '<a href="#">&laquo;</a>')
            Previous page element expression.
        * next - (expression: defaults '<a href="#">&raquo;</a>')
            Next page element expression.
        * selectedclass - (string: defaults 'selected')
            The class to add a selected page element.

    Example:
        var pt = new PagedTable('table');

    Result:
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
    var defaults = {
        limit: 5,
        pagelimit: 10,
        started: 1,
        insertpager: true,
        dragpager: false,
        fixedwidth: true,
        pager: '<p class="pager"></p>',
        page: '<a href="#"></a>',
        prev: '<a href="#">&laquo;</a>',
        next: '<a href="#">&raquo;</a>',
        selectedclass: 'selected'
    };
    this.options = $.extend(defaults, options);
    this.element = $($(selector).get(0));
    this.initialize();
}

PagedTable.version = '0.9.1';
PagedTable.updated = '2009-07-10 11:00';

PagedTable.prototype.initialize = function() {
    var self = this;
    this.rows = $('tbody > tr', this.element);
    this.length = this.rows.length;
    this.pages = Math.ceil(this.length / this.options.limit);
    this.pagers = [];

    var divide = function(elements, limit) {
        var divided = [];
        elements.each(function(i) {
            if (i % limit == 0) divided.push([]);
            divided[divided.length - 1].push(this);
        });
        return divided;
    }
    this.rows.divided = divide(this.rows, this.options.limit);

    if (this.options.fixedwidth) $('th', this.element).each(function() {
        $(this).width($(this).width() + 1);
    });
    if (this.options.insertpager) this.pager().insertAfter(this.element);
    if (this.options.pagelimit < 0) this.options.pagelimit = this.pages;

    return this.goto(this.options.started);
}

PagedTable.prototype.pager = function() {
    /** Returns new pager element for table.

    Syntax:
        tp.pager();

    Returns:
        (jQuery<element>) The jQuery object that contains new pager element.

    Example:
        tp.pager().insertBefore(tp.element);

    Result:
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
    if (!this.pagers.length) {
        var options = this.options;
        pager = $(options.pager);
        var self = this;

        var mousedown = options.dragpager ? function() {
            PagedTable.dragged = pager;
        } : null;

        var click = function() {
            self.goto($(this).text());
            return false;
        }

        $(options.prev).click(function() {
            var i = options.pagelimit *
                    (Math.ceil(self.page / options.pagelimit) - 1);
            self.goto(i);
            return false;
        }).appendTo(pager);
        for (var i = 0; i < Math.min(this.pages); ++ i) {
            var page = $(options.page);
            page.text(i + 1).click(click).mousedown(mousedown).appendTo(pager);
        }
        $(options.next).click(function() {
            var i = options.pagelimit *
                    Math.ceil(self.page / options.pagelimit) + 1;
            self.goto(i);
            return false;
        }).appendTo(pager);

        if (options.dragpager) {
            var d = function(p1, p2) {
                return Math.sqrt(Math.pow(p1[0] - p2[0], 2) +
                                 Math.pow(p1[1] - p2[1], 2));
            }
            $($.browser.msie ? document.body : window).mousemove(function(e) {
                var dragged = PagedTable.dragged;
                if (dragged) {
                    var cursor = [e.pageX, e.pageY];
                    var range = self._range();
                    var ds = [];
                    var pages = [];
                    var getdistance = function() {
                        var page = $(this);
                        var pos = page.position();
                        var center = [pos.left + page.width() / 2,
                                      pos.top + page.height() / 2];
                        var distance = d(cursor, center);
                        if (ds.length && ds[ds.length - 1] < distance) {
                            return false;
                        }
                        ds.push(distance);
                        pages.push(page);
                    }
                    $(dragged).children().slice(range[0], range[1] + 1)
                              .each(getdistance);
                    var i = $.inArray(Math.min.apply(null, ds), ds);
                    pages[i].click();
                    return false;
                }
            }).mouseup(function() { PagedTable.dragged = null; });
        }
    } else {
        pager = this.pagers[0].clone(true);
    }

    this.pagers.push(pager);

    return pager;
}

PagedTable.prototype.goto = function(page) {
    /** Go to certain page.

    Syntax:
        tp.goto(page);

    Returns:
        (PagedTable) This object.

    Example:
        tp.goto(14);

    Result:
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
    var self = this;
    var options = this.options;

    var page = page < 1 ? 1 : page > this.pages ? this.pages : page;
    var range = this._range(), newrange = this._range(page);
    var from = (page - 1) * this.options.limit, to = page * this.options.limit;

    (this._visiblerows || this.rows).hide();
    this._visiblerows = $(this.rows.divided[page - 1]).show();

    $(this.pagers).each(function() {
        var selected = options.selectedclass;
        var children = $(this).children();
        var length = self.length;

        if (length) {
            children.slice(1, self.pages + 1).hide();
            children.slice(range[0], range[1] + 1).removeClass(selected);
            children.slice(newrange[0], newrange[1] + 1).show();
            children.eq(page).addClass(selected);
        }

        var prev = children.eq(0);
        var next = children.eq(self.pages + 1);

        if (!length || newrange[0] == 1) prev.hide();
        else prev.show();
        if (!length || self.pages <= newrange[1]) next.hide();
        else next.show();
    });
    this.page = page;
    return this;
}

PagedTable.prototype.revert = function() {
    var self = this;
    $(this.pagers).empty();
    $(this.rows).show();
    $.each(['pagers', 'page', 'rows', '_visiblerows'], function() {
        delete self[this];
    });
    return this;
}

PagedTable.prototype._range = function(page) {
    page = page || this.page;
    var pagelimit = this.options.pagelimit;
    return [Math.ceil(page / pagelimit - 1) * pagelimit + 1,
            Math.ceil(page / pagelimit) * pagelimit];
}

$.fn.extend({
    pageable: function(options) {
        return new PagedTable(this, options);
    }
});
})(jQuery);

