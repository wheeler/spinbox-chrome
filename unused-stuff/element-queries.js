window.spinbox = window.spinbox || {};

spinbox.getVisibleSoundListElements = function () {
  return Array.from(
    document.querySelectorAll('li.soundList__item:not(.spinbox-hidden)')
  );
};

spinbox.getHiddenSoundListElements = function () {
  return document.querySelectorAll('li.soundList__item.spinbox-hidden');
};
