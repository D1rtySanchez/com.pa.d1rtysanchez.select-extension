(function() {
  var set = 'general'
  var display_sub_group = 'General'
  var kb = function(name, def) {
    action_sets[set][name] = function () {
      if (model[name]) model[name].apply(this, arguments)
    }
    api.settings.definitions.keyboard.settings[name] = {
      title: name.replace(/_/g, ' '),
      type: 'keybind',
      set: set,
      display_group: 'selext',
      display_sub_group: display_sub_group,
      default: def || '',
    }
  }

  set = 'gameplay'
  display_sub_group = 'Selection'
  kb('select_all_radars')
  kb('select_all_fabbers')
  kb('select_all_idle_fabbers')
  kb('select_all_scouts')
  kb('select_all_idle_scouts')
  
  set = 'gameplay'
  display_sub_group = 'Selection Edit'
  kb('single_select_closest')
  kb('only_siege_in_selection')
  kb('remove_siege_from_selection')
  //kb('only_anti-air_in_selection')
  //kb('remove_anti-air_from_selection')

})()
