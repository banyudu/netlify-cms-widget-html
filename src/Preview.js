import PropTypes from 'prop-types';
import React from 'react';

export default function Preview({ value }) {
  return <div dangerouslySetInnerHTML={{ __html: value }} />
}

Preview.propTypes = {
  value: PropTypes.node,
};
