require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json'))) rescue {}

Pod::Spec.new do |s|
  s.name           = 'LiveActivity'
  s.version        = package['version'] || '1.0.0'
  s.summary        = 'ActivityKit Live Activity bridge for the active-workout surface'
  s.description    = 'Starts/updates/ends the workout rest-timer Live Activity and Dynamic Island.'
  s.author         = ''
  s.homepage       = 'https://github.com/'
  # All ActivityKit usage is @available(iOS 16.2)-guarded, so the pod itself can
  # match the app's min target; the runtime gates the Live Activity at 16.2.
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
