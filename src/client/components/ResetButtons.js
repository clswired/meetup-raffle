/** @jsx jsx */
import PropTypes from 'prop-types';
import { jsx, Flex, Button } from 'theme-ui';

const ResetButtons = ({ onReset, onRetry }) => {
  return (
    <Flex
      sx={{
        flexWrap: 'wrap',
        flexShrink: 0,
        justifyContent: 'space-around',
        my: 4,
      }}
    >
      <Button sx={{ mb: [3, 0] }} type="button" onClick={onReset}>
        Start Over
      </Button>
      <Button type="button" onClick={onRetry}>
        Draw Again
      </Button>
    </Flex>
  );
};

ResetButtons.propTypes = {
  onReset: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

ResetButtons.displayName = 'ResetButtons';

export default ResetButtons;
