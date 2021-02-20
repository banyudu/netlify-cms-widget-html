import PropTypes from 'prop-types';
import React from 'react';
import DOMPurify from "dompurify";

const Preview = ({ value }) => {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }} />
}

Preview.propTypes = {
  value: PropTypes.node,
};

export default Preview
