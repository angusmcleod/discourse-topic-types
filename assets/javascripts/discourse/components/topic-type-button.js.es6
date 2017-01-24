import computed from "ember-addons/ember-computed-decorators";

export default Ember.Component.extend({
  tagName: "div",

  @computed('active')
  topicTypeClass() {
    const topicType = this.get('topicType');
    let classes = `topic-type-btn ${topicType}`
    if (this.get('active') === topicType) {
      classes += ' active'
    }
    return classes;
  },

  @computed()
  topicTypeLabel() {
    return `topic.type.${this.get('topicType')}`
  },

  actions: {
    switchTopicType(){
      this.sendAction('switchTopicType', this.get('topicType'))
    }
  }
})
