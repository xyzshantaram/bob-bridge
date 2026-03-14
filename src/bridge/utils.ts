export type IrcEvent = {
  source?: {
    name: string;
    mask?: {
      /** Username of the user. */
      user: string;
      /** Hostname of the user. */
      host: string;
    };
  };
};

export type PrivMsgChannelEvent = IrcEvent & {
  params: {
    target: string;
    text: string;
  };
};

export type CtcpActionEvent = PrivMsgChannelEvent;
export type JoinEvent = IrcEvent & {
  params: {
    channel: string;
  };
};

export type PartEvent = IrcEvent & {
  params: {
    channel: string;
    comment?: string;
  };
};

export type QuitEvent = IrcEvent & {
  params: {
    comment?: string;
  };
};

export type NickEvent = IrcEvent & {
  params: {
    nick: string;
  };
};

export type NamesEvent = IrcEvent & {
  params: {
    channel: string;
    names: { [x: string]: string[] };
  };
};
