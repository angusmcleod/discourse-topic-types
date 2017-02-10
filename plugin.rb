# name: discourse-topic-types
# about: Allows the user to select the type of topic they are creating in the composer
# version: 0.1
# authors: Angus McLeod

register_asset "stylesheets/topic-type-styles.scss"

gem 'docker-api', '1.33.2'

after_initialize do
  require 'docker'
  load File.expand_path('../jobs/build_syntaxnet_image.rb', __FILE__)

  module ::DiscoursePostType
    class Engine < ::Rails::Engine
      engine_name "discourse_post_type"
      isolate_namespace DiscoursePostType
    end
  end

  require_dependency "application_controller"
  class DiscoursePostType::TypeController < ::ApplicationController
    def enable_syntaxnet
      if !Docker::Image.exist?('syntaxnet')
        Jobs.enqueue(:build_syntaxnet_image, {})
      end
      render json: success_json
    end

    def update_syntaxnet_ready_status(status)
      $redis.set 'syntaxnet_image_ready', status
      channel = "/admin/syntaxnet-status"
      msg = { status: status }
      MessageBus.publish(channel, msg)
    end

    def check_type
      return unless Docker::Image.exist?('syntaxnet')

      text = params[:title]
      parsed = parse(text)
      types = SiteSetting.topic_types.split('|')
    end

    def parse(text)
      syntaxnet =  Docker::Container.create('Image' => 'syntaxnet', 'name' =>
                   'syntaxnet', 'Cmd' => ['syntaxnet/demo.sh'], 'OpenStdin' => true,
                   'StdinOnce' => true)
      stdin = StringIO.new(text)
      syntaxnet.tap(&:start).attach(stdin: stdin) { |stream, chunk|
        if stream == :stdout
          puts "#{chunk}"
        end
      }
    end
  end

  require_dependency "admin_constraint"
  DiscoursePostType::Engine.routes.draw do
    post "/check-type" => "type#check_type"
    post "/enable-syntaxnet" => "type#enable_syntaxnet", constraints: AdminConstraint.new
  end

  Discourse::Application.routes.append do
    mount ::DiscoursePostType::Engine, at: "type"
  end

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
