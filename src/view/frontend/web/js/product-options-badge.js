/**
 * @author      Andreas Knollmann
 * @copyright   Copyright (c) 2014-2025 Softwareentwicklung Andreas Knollmann
 * @license     http://www.opensource.org/licenses/mit-license.php MIT
 */

define([
    'jquery',
    'domReady',
    'priceUtils'
], function ($, domReady, utils) {
    'use strict';

    const globalOptions = {
        config: {},
        parentSelector: '.column.main',
        galleryPlaceholderSelector: '[data-gallery-role=gallery-placeholder]',
        galleryLoadedEventName: 'gallery:loaded amasty_gallery:loaded',
        galleryIdentifier: [
            '.gallery-placeholder .fotorama .fotorama__stage .fotorama__stage__shaft',
            '.gallery-placeholder #amasty-gallery #amasty-main-container'
        ],
        optionTypes: {
            dropdown: 'select.product-custom-option',
            radio: 'input[type="radio"].product-custom-option',
            checkbox: 'input[type="checkbox"].product-custom-option'
        }
    };

    $.widget('mage.productOptionsBadge', {
        options: globalOptions,

        _create: function createProductOptionsBadge() {
        },

        _init: function initProductOptionsBadge() {
            const self = this;

            $(self.options.galleryPlaceholderSelector, self.options.parentSelector).on(self.options.galleryLoadedEventName, function() {
                self.handleAll();

                const observer = new MutationObserver(function(mutations) {
                    $.each(mutations, function(key, mutation) {
                        $.each(mutation.addedNodes, function(key, addedNode) {
                            if ($(addedNode).attr('id') === 'amasty-main-image') {
                                self.handleAll();
                            }
                        });
                    });
                });

                const amastyContainer = document.querySelector('#amasty-main-container');
                if (amastyContainer) {
                    observer.observe(document.querySelector('#amasty-main-container'), {
                        subtree: true,
                        childList: true,
                    });
                }
            });

            domReady(function() {
                $.each(self.options.optionTypes, function(type, selector) {
                    $(selector, self.element).on('change', function() {
                        self.handleOptionChange(type, $(this));
                    })
                });
            });
        },

        handleAll: function handleAll() {
            const self = this;

            $.each(self.options.optionTypes, function(type, selector) {
                $(selector, self.element).on('change', function() {
                    self.handleOptionChange(type, $(this));
                })
            });
        },

        handleOptionChange: function handleOptionChange(type, inputElement) {
            const self = this;

            if (type === 'dropdown') {
                self.handleDropdown(inputElement);
            } else if (type === 'radio') {
                self.handleRadio(inputElement);
            } else if (type === 'checkbox') {
                self.handleCheckbox(inputElement);
            }
        },

        handleDropdown: function handleDropdown(selectElement) {
            const self = this;

            const optionId = utils.findOptionId(selectElement);

            if (optionId) {
                const isMultiSelect = selectElement.attr('multiple');

                if (isMultiSelect) {
                    let optionValueIds = selectElement.val();

                    if (! Array.isArray(optionValueIds)) {
                        optionValueIds = [optionValueIds];
                    }

                    const currentOverlayElements =
                        $('.product_custom_option_overlay[data-option-id="' + optionId + '"]');

                    currentOverlayElements.each(function() {
                        const currentOptionValueId = $(this).data('option-value-id');

                        if ($.inArray(currentOptionValueId, optionValueIds) === -1) {
                            self.remove(optionId, currentOptionValueId);
                        }
                    });

                    $.each(optionValueIds, function(index, optionValueId) {
                        self.add(optionId, optionValueId, true);
                    });
                } else {
                    self.remove(optionId);

                    const optionValueId = selectElement.val();

                    if (optionValueId) {
                        self.add(optionId, optionValueId, false);
                    }
                }
            }

            self.adjust();
        },

        handleRadio: function handleRadio(inputElement) {
            const self = this;

            if (inputElement.is(':checked')) {
                const optionId = utils.findOptionId(inputElement);

                if (optionId) {
                    self.remove(optionId);

                    const optionValueId = inputElement.val();

                    if (optionValueId) {
                        self.add(optionId, optionValueId, false);
                    }
                }

                self.adjust();
            }
        },

        handleCheckbox: function handleRadio(inputElement) {
            const self = this;

            const optionId = utils.findOptionId(inputElement);

            if (optionId) {
                const optionValueId = inputElement.val();

                if (optionValueId) {
                    if (inputElement.is(':checked')) {
                        self.add(optionId, optionValueId, true);
                    } else {
                        self.remove(optionId, optionValueId);
                    }

                    self.adjust();
                }
            }
        },

        add: function addProductOptionsBadge(optionId, optionValueId, isMultiSelect) {
            const self = this;

            const optionConfig = self.options.config[optionId];

            if (optionConfig) {
                const optionValuesConfig = optionConfig.values;

                if (optionValuesConfig) {
                    const optionValueBadgeUrl = optionValuesConfig[optionValueId];

                    if (optionValueBadgeUrl) {
                        $.each(self.getGalleryIdentifier(), function(key, identifier) {
                            $(identifier, self.options.parentSelector).each(function() {
                                const imageElement = $(this);

                                const overlayElementId = isMultiSelect ?
                                    'product-custom-option-overlay-' + optionId + '-' + optionValueId :
                                    'product-custom-option-overlay-' + optionId;

                                const overlayElement = $('<div>', {
                                    id: overlayElementId,
                                    class: 'product_custom_option_overlay',
                                    'data-option-id': optionId,
                                    'data-option-value-id': optionValueId
                                });
                                overlayElement.appendTo(imageElement);

                                const overlayImageElement = $('<img>', {
                                    src: optionValueBadgeUrl,
                                    class: 'product_custom_option_overlay_image'
                                });
                                overlayImageElement.appendTo(overlayElement);
                            });
                        });
                    }
                }
            }
        },

        getGalleryIdentifier: function getGalleryIdentifier() {
            return this.options.galleryIdentifier;
        },

        remove: function removeProductOptionsBadge(optionId, optionValueId) {
            if (optionValueId) {
                $('#product-custom-option-overlay-' + optionId + '-' + optionValueId).each(function() {
                    $(this).remove();
                });
            } else {
                $('#product-custom-option-overlay-' + optionId).each(function() {
                    $(this).remove();
                });
            }
        },

        adjust: function adjustProductOptionsBadge() {
            let overlayCount = 0;

            $.each($('.product_custom_option_overlay').get().reverse(), function() {
                const overlayElement = $(this);
                overlayElement.removeClass('product_custom_option_overlay-1');
                overlayElement.removeClass('product_custom_option_overlay-2');
                overlayElement.removeClass('product_custom_option_overlay-3');
                overlayElement.removeClass('product_custom_option_overlay-4');
                overlayElement.removeClass('product_custom_option_overlay-5');

                overlayCount++;

                if (overlayCount <= 5) {
                    overlayElement.addClass('product_custom_option_overlay-' + overlayCount);
                    overlayElement.show();
                } else {
                    overlayElement.hide();
                }
            });
        }
    });

    return $.mage.productOptionsBadge;
});
