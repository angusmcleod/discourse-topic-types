# name: discourse-topic-types
# about: Allows the user to select the type of topic they are creating in the composer
# version: 0.1
# authors: Angus McLeod

register_asset "stylesheets/topic-type-styles.scss"

after_initialize do
  require 'topic_subtype'
  class ::TopicSubtype
    def initialize(id, options)
      super
      SiteSetting.topic_types.each do |type|
        define_method "self.#{type}" do
          type
        end
        register type
      end
    end
  end

  PostRevisor.track_topic_field(:wiki)
  PostRevisor.track_topic_field(:topic_type)

  DiscourseEvent.on(:post_created) do |post, opts, user|
    if post.is_first_post? and opts[:tags]
      topic = Topic.find(post.topic_id)
      topic_type = opts[:tags] & SiteSetting.topic_types.split('|')
      if topic_type.first == 'wiki'
        post.wiki = true
        post.save!
      end
      topic.subtype = topic_type.first
      topic.save!
    end
  end

end
