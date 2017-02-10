import Composer from 'discourse/models/composer';
import ComposerBody from 'discourse/components/composer-body';
import ComposerTitle from 'discourse/components/composer-title';
import ComposerMessages from 'discourse/components/composer-messages';
import ComposerController from 'discourse/controllers/composer';
import { observes, on } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'topictype-edits',
  initialize(container){
    const messageBus = container.lookup('message-bus:main'),
          site = container.lookup('site:main');

    messageBus.subscribe("/syntaxnet-status", function(data) {
      console.log(data)
      site.set('syntaxnetReady', data.status)
    })

    Composer.serializeOnCreate('topic_type', 'topicType')
    Composer.serializeOnCreate('wiki')

    Composer.reopen({
      topicType: Discourse.SiteSettings.topic_type_default,
      wiki: Ember.computed.bool('topicType', 'wiki'),
      titlePlaceholder: 'composer.topic_type.placeholder'
    })

    ComposerBody.reopen({
      @observes('composer.topicType')
      updateType() {
        this.resizeFull();
      }
    })

    ComposerTitle.reopen({
      @observes('composer.titleLength')
      titleObserver() {
        if (this.get('composer.titleLength') > 3) {
          Ember.run.debounce(this, function() {
            this.appEvents.trigger('composer:check-type');
          }, 500);
        }
      }
    })

    ComposerMessages.reopen({
      queuedForTyping: [],

      @on('didInsertElement')
      setupCheckType() {
        this.appEvents.on('composer:check-type', this, this._checkType);
      },

      @on('willDestroyElement')
      destroyCheckType() {
        this.appEvents.off('composer:check-type', this, this._checkType);
      },

      _checkType() {
        const composer = this.get('composer');
        if (!composer.get('creatingTopic')) { return; }

        const topicTypes = Discourse.SiteSettings.topic_types.split('|');
        const origBody = composer.get('reply').toLowerCase() || '';
        const title = composer.get('title').toLowerCase() || '';
        const body = origBody.substr(0, 200);

        const message = composer.store.createRecord('composer-message', {
          id: 'topic_type',
          templateName: 'topic-type',
          extraClass: 'topic-type'
        });

        for (var i = 0; i < topicTypes.length; i++) {
          let matches = I18n.t(`topic.type.${topicTypes[i]}.matches`).split('|');
          for (var x = 0; x < matches.length; x++) {
            if (title.indexOf(matches[x]) > -1 || body.indexOf(matches[x]) > -1) {
              let createType = I18n.t(`topic.type.${topicTypes[i]}.creating`);
              message.set('createType', createType);
              this.send('popup', message);
              this.set('composer.topicType', topicTypes[i]);
            }
          }
        }
      }
    })

    ComposerController.reopen({
      @observes('model.topicType')
      updateType() {
        if (Discourse.SiteSettings.topic_type_add_to_tags) {
          this.addTopictypeToTags();
        }
      },

      addTopictypeToTags: function() {
        const topicType = this.get('model.topicType')
        if (topicType) {
          let tags = this.get('tags') || []
          if (this.get('topicTypeTag')) {
            tags.splice(tags.indexOf(this.get('topicTypeTag')), 1)
          }
          tags.push(topicType)
          this.setProperties({
            topicTypeTag: topicType,
            'model.tags': tags
          })
        }
      }
    })
  }
}
