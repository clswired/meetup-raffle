/** @jsx jsx */
import PropTypes from 'prop-types';
import { jsx, Link, Flex, AspectRatio, Text } from 'theme-ui';

const Winner = ({ winner }) => {
  return (
    <Link
      href={winner.profileURL}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        width: 4,
        mb: 3,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'primary',
        boxShadow: 5,
        '&:hover, &:focus': {
          opacity: 0.5,
        },
      }}
    >
      <Flex sx={{ flexDirection: 'column' }}>
        <AspectRatio
          ratio={1}
          role="img"
          sx={{
            backgroundImage: `url(${winner.photoURL}), url('/user-placeholder.svg')`,
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
        <Text as="span" sx={{ p: 3, textAlign: 'center', bg: 'formFieldBg' }}>
          {winner.name}
        </Text>
      </Flex>
    </Link>
  );
};

Winner.propTypes = {
  winner: PropTypes.shape({
    name: PropTypes.string.isRequired,
    photoURL: PropTypes.string,
    profileURL: PropTypes.string.isRequired,
  }).isRequired,
};

Winner.displayName = 'Winner';

export default Winner;
