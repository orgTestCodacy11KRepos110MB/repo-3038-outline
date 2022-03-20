import * as React from "react";
import { useHistory } from "react-router-dom";
import { Optional } from "utility-types";
import embeds from "@shared/editor/embeds";
import { isInternalUrl } from "@shared/utils/urls";
import Comment from "~/models/Comment";
import ErrorBoundary from "~/components/ErrorBoundary";
import { Props as EditorProps } from "~/editor";
import useDictionary from "~/hooks/useDictionary";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import { uploadFile } from "~/utils/files";
import { isModKey } from "~/utils/keyboard";
import { isHash } from "~/utils/urls";

const SharedEditor = React.lazy(
  () =>
    import(
      /* webpackChunkName: "shared-editor" */
      "~/editor"
    )
);

export type Props = Optional<
  EditorProps,
  | "placeholder"
  | "defaultValue"
  | "onClickLink"
  | "embeds"
  | "dictionary"
  | "onShowToast"
> & {
  shareId?: string | undefined;
  embedsDisabled?: boolean;
  grow?: boolean;
  onSynced?: () => Promise<void>;
  onPublish?: (event: React.MouseEvent) => any;
};

function Editor(props: Props, ref: React.Ref<any>) {
  const { id, shareId } = props;
  const { ui, comments } = useStores();
  const { showToast } = useToasts();
  const dictionary = useDictionary();
  const history = useHistory();

  const handleUploadFile = React.useCallback(
    async (file: File) => {
      const result = await uploadFile(file, {
        documentId: id,
      });
      return result.url;
    },
    [id]
  );

  const handleClickLink = React.useCallback(
    (href: string, event: MouseEvent) => {
      // on page hash
      if (isHash(href)) {
        window.location.href = href;
        return;
      }

      if (isInternalUrl(href) && !isModKey(event) && !event.shiftKey) {
        // relative
        let navigateTo = href;

        // probably absolute
        if (href[0] !== "/") {
          try {
            const url = new URL(href);
            navigateTo = url.pathname + url.hash;
          } catch (err) {
            navigateTo = href;
          }
        }

        if (shareId) {
          navigateTo = `/share/${shareId}${navigateTo}`;
        }

        history.push(navigateTo);
      } else if (href) {
        window.open(href, "_blank");
      }
    },
    [history, shareId]
  );

  const handleShowToast = React.useCallback(
    (message: string) => {
      showToast(message);
    },
    [showToast]
  );

  const handleClickComment = React.useCallback(
    (commentId?: string) => {
      if (commentId) {
        ui.expandComments();
        history.replace({
          pathname: window.location.pathname,
          search: `?commentId=${commentId}`,
        });
      } else {
        history.replace({
          pathname: window.location.pathname,
        });
      }
    },
    [ui, history]
  );

  const handleDraftComment = React.useCallback(
    (commentId: string) => {
      ui.expandComments();

      const comment = new Comment(
        {
          documentId: id,
        },
        comments
      );
      comment.id = commentId;
      comments.add(comment);
    },
    [comments, id, ui]
  );

  const handleRemoveComment = React.useCallback((commentId: string) => {
    console.log({ commentId });
  }, []);

  return (
    <ErrorBoundary reloadOnChunkMissing>
      <SharedEditor
        ref={ref}
        uploadFile={handleUploadFile}
        onShowToast={handleShowToast}
        embeds={embeds}
        dictionary={dictionary}
        {...props}
        onClickLink={handleClickLink}
        onClickComment={handleClickComment}
        onDraftComment={handleDraftComment}
        onRemoveComment={handleRemoveComment}
        placeholder={props.placeholder || ""}
        defaultValue={props.defaultValue || ""}
      />
    </ErrorBoundary>
  );
}

export default React.forwardRef(Editor);
