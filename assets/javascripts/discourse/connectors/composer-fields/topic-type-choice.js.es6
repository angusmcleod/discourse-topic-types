export default {
  setupComponent(args, component) {
    component.set('topicTypes', Discourse.SiteSettings.topic_types.split('|'));

    component.set('newTopic', args.model.get('draftKey') === 'new_topic');
    Ember.addObserver(args.model, 'draftKey', this, function(model, property) {
      if (this._state === 'destroying') { return }

      this.set('newTopic', model.get('draftKey') === 'new_topic');
    })

    component.set('activeType', args.model.get('topicType'));
    Ember.addObserver(args.model, 'topicType', this, function(model, property) {
      this.set('activeType', model.get('topicType'));
    })

    // ensure topic type is at start of composer-fields outlet
    Ember.run.schedule('afterRender', this, function() {
      const element = component.$()
      component.$().prependTo(component.$().parent())
    })
  },

  actions: {
    switchTopicType(topicType) {
      if (!this.get('currentUser')) {
        const appRoute = this.container.lookup('route:application');
        return appRoute.send('showLogin');
      }

      this.setProperties({
        activeType: topicType,
        'model.topicType': topicType
      });
      return true
    }
  }
}
