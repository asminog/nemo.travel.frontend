
$(document).on('click', '.nemo-hotels-results__hotelsGroup__footer__TP_header', function(){

    $(this)
        .closest('.nemo-hotels-results__hotelsGroup__footer')
        .find('.nemo-hotels-results__hotelsGroup__footer__TP_content')
        .toggle();
});

var isNemoWidgetStartPageFirstRun = true;