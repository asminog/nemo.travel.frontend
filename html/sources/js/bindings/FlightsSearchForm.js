'use strict';
define(
	['knockout', 'jquery', 'jqueryUI'],
	function (ko, $) {
		// FlightsSearchForm Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
			 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
			 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };

		 // Do not forget to add destroy callbacks
		 ko.utils.domNodeDisposal.addDisposeCallback(element, function() {});
		 */
		ko.bindingHandlers.positionPassengersPopup = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				// Timeout is needed because we don't have needed HTML at the time we call this binding.
				// Thus - we delay actual binding execution for knockout to construct needed HTML
				setTimeout(function () {
					var parent = element.parentNode,
						offset = (parent.clientHeight - Math.min(element.clientHeight, parent.clientHeight)) / 2;

					element.style.marginTop = offset+'px';

//					if (element.clientHeight > parent.clientHeight) {
//						var header = element.children[0],
//							content = element.children[1],
//							footer = element.children[2];
//						content.style.height = (parent.clientHeight - header.clientHeight - footer.clientHeight)+'px';
//					}
				}, 1);
			}
		};

		// Extending jQueryUI.autocomplete for Flights Search Form geo autocomplete
		$.widget( "nemo.FlightsFormGeoAC", $.ui.autocomplete, {
			_renderItem: function( ul, item ) {
				// If item has label - it's something other than geo point that should be in AC
				return $( "<li>" )
							.append( typeof item.label != 'undefined' ? item.label : (item.name + ', ' + item.country.name) )
					.appendTo( ul );
			}
		});

		ko.bindingHandlers.flightsFormGeoAC = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					noResultsResults = [{value: '', label: viewModel.$$controller.i18n('FlightsSearchForm', 'autocomplete_noResults')}];

				$element.FlightsFormGeoAC({
					source: function (request, callback) {
						$.get(
							viewModel.$$controller.options.dataURL + '/guide/autocomplete/iata/' + encodeURIComponent(request.term),
							function (data) {
								var result = [],
									tmp;

								if (data.system && data.system.error) {
									callback(noResultsResults);
								}

								for (var i in data.guide.countries) {
									if (data.guide.countries.hasOwnProperty(i)) {
										tmp = data.guide.countries[i];
										tmp.IATA = i;

										data.guide.countries[i] = viewModel.$$controller.getModel('BaseStaticModel', tmp);
									}
								}

								// Converting autocomplete data into an array of possibilities
								for (var i = 0; i < data.guide.autocomplete.iata.length; i++) {
									if (data.guide.autocomplete.iata[i].isCity) {
										tmp = data.guide.cities[data.guide.autocomplete.iata[i].cityId];
										tmp.IATA = tmp.codeIATA;
										delete tmp.codeIATA;
									}
									else {
										tmp = data.guide.airports[data.guide.autocomplete.iata[i].IATA];
										tmp.IATA = data.guide.autocomplete.iata[i].IATA;
									}

									tmp.isCity = data.guide.autocomplete.iata[i].isCity;

									// Setting country
									tmp.country = null;
									if (data.guide.countries[tmp.countryCode]) {
										tmp.country = data.guide.countries[tmp.countryCode];
									}

									result.push(viewModel.$$controller.getModel('BaseStaticModel', tmp));
								}

								if (result.length == 0) {
									result = noResultsResults;
								}

								callback(result);
							},
							'json'
						).error(function () {
							callback(noResultsResults);
						});
					},
					select: function( event, ui ) {
						$element.blur();

						// If item has label - it's something other than geo point that should be in AC
						// So we set corresponding stuff only if it's valid
						if (typeof ui.item.label == 'undefined') {
							valueAccessor()(ui.item);
							$element.trigger('nemo.fsf.segmentPropChanged', {segment: viewModel});
						}

						return false;
					}
				});

				$element.on('blur', function (e) {
					$element.val('');
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('blur');

					try {
						$element.autocomplete('destroy');
					}
					catch (e) {/* Do nothing */}
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};

		ko.bindingHandlers.flightsFormAutoFocus = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				$element.on('nemo.fsf.segmentPropChanged', function (event, data) {
					var $target = $(event.target),
						$segment = $target.parents('.js-autofocus-segment'),
						segment = data.segment,
						$focusField = null;

					if ($target.hasClass('js-autofocus-field_departure')) {
						console.log('field_departure', segment.arrival(), segment.departureDate());
						if (!segment.arrival()) {
							$focusField = $segment.find('.js-autofocus-field_arrival');
						}
						else if (!segment.departureDate()) {
							$focusField = $segment.find('.js-autofocus-field_date');
						}
					}
					else if ($target.hasClass('js-autofocus-field_arrival')) {
						if (!segment.departureDate()) {
							$focusField = $segment.find('.js-autofocus-field_date');
						}
					}

					if ($focusField) {
						$focusField.focus();
					}
				});

			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};
	}
);