import $ from 'jquery';
import BaseVw from './baseVw';
import loadTemplate from '../utils/loadTemplate';
import app from '../app';

export default class extends BaseVw {
  constructor(options = {}) {
    super(options);
    this.options = options;

    this.listenTo(app.profile, 'change', this.render, this);
  }

  events() {
    return {
      'click input[type=submit]': 'onSaveForm',
      'click input[type=reset]': 'onResetForm',
      'click .js-AddSocial': 'onClickAddSocial',
      'click .js-RemoveSocial': 'onClickRemoveSocial',
    };
  }

  className() {
    return 'testProfilePage';
  }

  onSaveForm(e) {
    e.preventDefault();
    this.saveForm();
  }

  onClickAddSocial() {
    const social = app.profile.get('social') || [];

    social.push({
      type: app.profile.socialTypes[0],
      username: '',
    });

    app.profile.set('social', social);
  }

  onClickRemoveSocial(e) {
    const index = $(e.target).parents('.socialAccount').index();
    const social = app.profile.get('social');

    social.splice(index, 1);
    app.profile.set('social', social);
  }

  saveForm() {
    app.profile.set(this.getFormData());
    const formSave = app.profile.save();

    if (formSave) {
      new Notification('Saving...', { silent: true }); // eslint-disable-line no-new

      formSave.done(() => {
        new Notification('Save complete', { silent: true }); // eslint-disable-line no-new
      }).fail((data) => {
        app.simpleMessageModal.open('There was an error saving the data.', data.reason || '');
      });
    }

    // render so errors are shown / cleared
    this.render();
  }

  getFormData() {
    const formData = {};

    this.$fields = this.$fields || this.$('input[name], textarea[name], select[name]');
    this.$fields.each((index, field) => {
      const $field = $(field);
      const name = $field.attr('name');
      const leftBracketIndex = name.indexOf('[');

      // nested arrays - for now, only abstracted out for one level of nesting
      if (leftBracketIndex !== -1) {
        const nestedIndex = parseInt(name.slice(leftBracketIndex + 1, name.indexOf(']')), 10);
        const type = name.slice(name.indexOf('.') + 1);
        const topAttr = name.slice(0, leftBracketIndex);

        formData[topAttr] = formData[topAttr] || [];

        formData[topAttr][nestedIndex] =
          formData[topAttr][nestedIndex] || {};

        formData[topAttr][nestedIndex][type] = field.value;
      } else {
        formData[name] = field.value;
      }
    });

    return formData;
  }

  onResetForm(e) {
    e.preventDefault();
    app.profile.reset();
    if (!app.profile.hasChanged()) this.render();
  }

  render() {
    loadTemplate('testProfile.html', (t) => {
      this.$el.html(t({
        ...app.profile.toJSON(),
        socialTypes: app.profile.socialTypes,
        errors: app.profile.validationError || {},
      }));
      this.$fields = null;
    });

    return this;
  }
}
