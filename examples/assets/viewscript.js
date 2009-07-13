(function($) {
    var script = $('script.code').html().replace(
        /\/\/ <!\[CDATA\[\s*|\s*\/\/ \]\]>/g, ''
    );
    $('<code><pre>' + script.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    + '</pre></code>').insertAfter('h1');
})(jQuery);

