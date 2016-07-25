import _ from 'underscore';
import BaseModel from './BaseModel';
import app from '../app';
import is from 'is_js';

export default class extends BaseModel {
  defaults() {
    return {
      primaryColor: '#086A9E',
      secondaryColor: '#317DB8',
      textColor: '#ffffff',
      social: [],
    };
  }

  url() {
    // url is handled by sync, but backbone bombs if I don't have
    // something explicitly set
    return 'use-sync';
  }

  getColorFields() {
    return [
      'primaryColor',
      'secondaryColor',
      'textColor',
    ];
  }

  // Ensure any colors are strings and have a leading hash.
  standardizeColorFields(attrs = {}) {
    const updatedAttrs = { ...attrs };

    this.getColorFields().forEach((field) => {
      if (typeof attrs[field] !== 'undefined') {
        updatedAttrs[field] = updatedAttrs[field].toString();
        updatedAttrs[field] = updatedAttrs[field].charAt(0) !== '#' ?
          `#${updatedAttrs[field]}` : updatedAttrs[field];
      }
    });

    return updatedAttrs;
  }

  set(key, val, options) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    let attrs;
    let opts = options;

    if (typeof key === 'object') {
      attrs = key;
      opts = val;
    } else {
      (attrs = {})[key] = val;
    }

    if (attrs.social) {
      if (!_.isEqual(attrs.social, this._social)) {
        this.attributes.social = this._social;

        // if the object contents are not equal, we'll clone a new object so
        // the change is event is fired.
        this._social = JSON.parse(JSON.stringify(attrs.social)); // deep clone
        attrs.social = JSON.parse(JSON.stringify(attrs.social));
      }
    }

    return super.set(this.standardizeColorFields(attrs), opts);
  }

  get socialTypes() {
    return [
      'facebook',
      'twitter',
      'instagram',
      'other',
    ];
  }

  validate(attrs) {
    const errObj = {};
    const addError = (fieldName, error) => {
      errObj[fieldName] = errObj[fieldName] || [];
      errObj[fieldName].push(error);
    };

    const colorFields = this.getColorFields();

    colorFields.forEach((colorField) => {
      const clr = attrs[colorField];

      if (typeof clr !== 'undefined' && is.not.hexColor(clr)) {
        addError(colorField, 'Please provide a valid hex color.');
      }
    });

    if (attrs.email && is.not.email(attrs.email)) {
      addError('email', 'Please provide a valid email.');
    }

    if (attrs.website && is.not.url(attrs.website)) {
      addError('website', 'Please provide a valid url.');
    }

    if (is.not.array(attrs.social)) {
      addError('social', 'Social must be an array.');
    } else {
      // used to give errors on dupes of the same type
      const groupedByType = _.groupBy(attrs.social, 'type');

      attrs.social.forEach((item, index) => {
        if (is.not.string(item.username) || !item.username.length) {
          addError(`social[${index}].username`, 'Please provide a username.');
        }

        if (is.not.string(item.type)) {
          addError(`social[${index}].type`, 'Please provide a type.');
        } else if (this.socialTypes.indexOf(item.type) === -1) {
          addError(`social[${index}].type`, 'Type must be one of the required types.');
        }

        // if there are dupes of the same type, give an error to all
        // dupes after the first one
        if (groupedByType[item.type].length > 1 &&
          groupedByType[item.type].indexOf(item) > 0) {
          addError(`social[${index}].type`, 'You already have a social account of this type.');
        }
      });
    }

    if (Object.keys(errObj).length) return errObj;

    return undefined;
  }

  sync(method, model, options) {
    // the server doesn't want the id field
    options.attrs = options.attrs || model.toJSON(options);
    delete options.attrs.id;

    // ensure certain fields that shouldn't be updated don't go
    // to the server
    if (method !== 'read') {
      delete options.attrs.followerCount;
      delete options.attrs.followingCount;
      delete options.attrs.listingCount;
      delete options.attrs.lastModified;
    }

    if (method === 'read') {
      options.url = app.getServerUrl(`ipns/${model.id}/profile`);
    } else {
      options.url = app.getServerUrl(`ob/profile/${app.profile.id !== model.id ? model.id : ''}`);
    }

    return super.sync(method, model, options);
  }
}
