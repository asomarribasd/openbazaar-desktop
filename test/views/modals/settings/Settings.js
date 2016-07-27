import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import Settings from '../../../../js/views/modals/settings/Settings';
import jsdom from 'jsdom';

global.document = jsdom.jsdom('<html><body><div></div></body></html>');
global.window = document.defaultView;
global.jQuery = global.$ = require('jquery')(window);
global.Backbone = require('backbone');
//global.Backbone.$ = global.jQuery;

describe('a Settings view', () => {
  let settingsModal;

  beforeEach(() => {

    settingsModal = new Settings();
    $('body').append(settingsModal.render().el);
  });

  it('has access to jquery and $', function () {
    expect(window.$('body').html()).to.have.string('<div></div>');
  });

  it('renders the Settings template', () => {
    //testView = new BaseModal({ el: global.$('body div') });
    //expect(settingsModal).to.be.ok;
    //expect(testDiv.find('.settings')).to.exist;
  });
});
