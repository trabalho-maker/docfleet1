import { createDataLayer } from "@/features/data/repositories";
import { getDatabaseAdapter } from "@/lib/database/provider";
import { createSessionDatabaseAdapter } from "@/lib/database/session-adapter";

export type PasswordResetResult =
  | {
      success: false;
    }
  | {
      success: true;
      user: {
        id: string;
        email: string;
      };
    };

export async function resetPasswordWithToken(token: string, password: string) {
  const databaseAdapter = getDatabaseAdapter();

  return databaseAdapter.write<PasswordResetResult>(async (session) => {
    const scopedAdapter = createSessionDatabaseAdapter(databaseAdapter.provider, session);
    const dataLayer = createDataLayer({ adapter: scopedAdapter });

    await dataLayer.passwordResetTokens.deleteExpired();
    const resetToken = await dataLayer.passwordResetTokens.findValidByRawToken(token);

    if (!resetToken) {
      return {
        success: false,
      };
    }

    await dataLayer.users.updatePassword(resetToken.user.id, password);
    await dataLayer.passwordResetTokens.consume(resetToken.id);
    await dataLayer.passwordResetTokens.deleteActiveForUser(resetToken.user.id);

    return {
      success: true,
      user: {
        id: resetToken.user.id,
        email: resetToken.user.email,
      },
    };
  });
}
