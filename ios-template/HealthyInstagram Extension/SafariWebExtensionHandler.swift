import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = item?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = item?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = item?.userInfo?[SFExtensionMessageKey]
        } else {
            message = item?.userInfo?["message"]
        }

        os_log(.default, "Healthy Instagram extension received message: %{public}@", String(describing: message))

        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: ["status": "ok"]]
        } else {
            response.userInfo = ["message": ["status": "ok"]]
        }

        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
