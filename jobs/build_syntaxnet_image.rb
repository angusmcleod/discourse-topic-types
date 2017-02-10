module Jobs
  class BuildSyntaxnetImage < Jobs::Base
    sidekiq_options timeout: 1000

    def execute(args)
      Excon.defaults[:write_timeout] = 1000
      Excon.defaults[:read_timeout] = 1000

      dockerfile_path = "#{Rails.root}/plugins/discourse-topic-types"
      Docker::Image.build_from_dir(dockerfile_path, {'t' => 'syntaxnet:latest'})  do |v|
        if (log = JSON.parse(v)) && log.has_key?("stream")
          puts log["stream"]
        end
      end

      DiscoursePostType::PostTypeController.update_image_ready_status(true)
    end
  end
end
