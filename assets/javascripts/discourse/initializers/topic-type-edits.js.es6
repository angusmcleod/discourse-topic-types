import Composer from 'discourse/models/composer';
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

    if (Discourse.SiteSettings.topic_type_add_to_tags) {
      ComposerController.reopen({
        @on('init')
        @observes('model.topicType')
        addTopictypeToTags() {
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
}
