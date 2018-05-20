// @flow strict
import React from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';

import Icon from './sidebar/Icon';

const styles = StyleSheet.create({
  twistOption: {
    border: 'none',
    pointerEvents: 'initial',
    margin: 50,
  },

  twistOptions: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
});

function TwistOption({ orientation, onClick }) {
  return (
    <button onClick={onClick} className={css(styles.twistOption)}>
      <Icon name={`rotate-${orientation}`} angle={180} size={48} />
    </button>
  );
}

interface Props {
  // FIXME move this to a damn type
  onClick(twist: 'left' | 'right'): void;
}

export default function TwistOptions({ onClick }: Props) {
  return (
    <div className={css(styles.twistOptions)}>
      <TwistOption orientation="left" onClick={() => onClick('left')} />
      <TwistOption orientation="right" onClick={() => onClick('right')} />
    </div>
  );
}