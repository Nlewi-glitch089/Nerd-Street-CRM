export { signToken, verifyToken, getUserFromToken } from '../../lib/auth'

// Next.js requires a default export for files under `pages/`.
// Provide a no-op component so this helper file doesn't break the build.
export default function __AuthLibPage() {
	return null
}
