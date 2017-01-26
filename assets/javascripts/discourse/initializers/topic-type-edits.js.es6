import Composer from 'discourse/models/composer';
import ComposerBody from 'discourse/components/composer-body';
import ComposerController from 'discourse/controllers/composer';
import { observes, on } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'topictype-edits',
  initialize(){
    Composer.serializeOnCreate('topic_type', 'topicType')
    Composer.serializeOnCreate('wiki')

    Composer.reopen({
      topicType: Discourse.SiteSettings.topic_type_default,
      wiki: Ember.computed.bool('topicType', 'wiki'),
    })

    ComposerBody.reopen({
      @observes('composer.topicType')
      updateType() {
        this.resizePartial();
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
