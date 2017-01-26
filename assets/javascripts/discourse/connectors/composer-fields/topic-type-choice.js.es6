export default {
  setupComponent(args, component) {
    component.set('topicTypes', Discourse.SiteSettings.topic_types.split('|'));
    component.set('activeType', args.model.get('topicType'));

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
